import { neon } from "@neondatabase/serverless";
import { readFileSync, writeFileSync, existsSync } from "fs";

// Citim .env.local manual
const envFile = readFileSync(".env.local", "utf8");
const dbUrl   = envFile.match(/DATABASE_URL=(.+)/)[1].trim();
const sql     = neon(dbUrl);

const PROGRESS_FILE = "scripts/progress.json";

function loadProgress() {
  if (existsSync(PROGRESS_FILE)) {
    return JSON.parse(readFileSync(PROGRESS_FILE, "utf8"));
  }
  return { lastYear: 2007, lastWeek: 0, source: "CAN" };
}

function saveProgress(year, week, source) {
  writeFileSync(PROGRESS_FILE, JSON.stringify({ lastYear: year, lastWeek: week, source }));
}

function getWeeks(year) {
  const weeks  = [];
  const start  = new Date(`${year}-01-01`);
  const end    = new Date(`${year}-12-31`);
  let   cursor = new Date(start);

  while (cursor <= end) {
    const from = new Date(cursor);
    const to   = new Date(cursor);
    to.setDate(to.getDate() + 6);
    if (to > end) to.setTime(end.getTime());
    weeks.push({ from, to });
    cursor.setDate(cursor.getDate() + 7);
  }
  return weeks;
}

async function syncWeek(from, to, source) {
  const endpoint = source === "CN"
    ? "https://www.e-licitatie.ro/api-pub/NoticeCommon/GetCNoticeList/"
    : "https://www.e-licitatie.ro/api-pub/NoticeCommon/GetCANoticeList";

  let pageIndex     = 0;
  let totalPages    = 1;
  let totalInserted = 0;

  while (pageIndex < totalPages) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "Referer": "https://e-licitatie.ro/pub/notices/contract-notices/list/0/0",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: JSON.stringify({
        sysNoticeTypeIds:       [],
        sortProperties:         [],
        pageSize:               200,
        pageIndex,
        hasUnansweredQuestions: false,
        startPublicationDate:   from.toISOString(),
        endPublicationDate:     to.toISOString(),
      }),
    });

    if (!response.ok) {
      console.error(`  SEAP error ${response.status}`);
      break;
    }

    const data  = await response.json();
    const items = data.items || [];

    if (pageIndex === 0) {
      totalPages = Math.ceil((data.total || 0) / 200);
    }

    for (const item of items) {
      try {
        const cpvParts = item.cpvCodeAndName?.split(" - ") || [];
        const cpvCode  = cpvParts[0] || "";
        const cpvName  = cpvParts.slice(1).join(" - ").replace(/\s*\(Rev\.2\)/g, "") || "";
        const itemId   = item.caNoticeId || item.noticeId;

        await sql`
          INSERT INTO licitatii (
            id, notice_no, title, authority,
            contract_type, procedure_type, procedure_state,
            cpv_code, cpv_name, value_ron, currency,
            is_online, notice_date, notice_source
          ) VALUES (
            ${itemId},
            ${item.noticeNo},
            ${item.contractTitle},
            ${item.contractingAuthorityNameAndFN},
            ${item.sysAcquisitionContractType?.text},
            ${item.sysProcedureType?.text},
            ${item.sysProcedureState?.text},
            ${cpvCode},
            ${cpvName},
            ${item.ronContractValue || 0},
            ${item.currencyCode},
            ${item.isOnline},
            ${item.noticeStateDate || null},
            ${source}
          )
          ON CONFLICT (id) DO UPDATE SET
            procedure_state = EXCLUDED.procedure_state,
            value_ron       = EXCLUDED.value_ron,
            notice_date     = EXCLUDED.notice_date,
            notice_source   = EXCLUDED.notice_source
        `;
        totalInserted++;
      } catch (e) {
        // skip duplicate sau eroare
      }
    }

    pageIndex++;
    await new Promise(r => setTimeout(r, 400));
  }

  return totalInserted;
}

async function importSource(source, startYear, startWeek) {
  const endYear = new Date().getFullYear();

  console.log(`\n${'='.repeat(50)}`);
  console.log(`📥 Import ${source}: ${startYear} (săpt. ${startWeek}) → ${endYear}`);
  console.log('='.repeat(50));

  let grandTotal = 0;

  for (let year = startYear; year <= endYear; year++) {
    const weeks     = getWeeks(year);
    const startWeekIdx = year === startYear ? startWeek : 0;

    console.log(`\n📅 ${source} — Anul ${year} (${weeks.length} săptămâni)`);

    for (let w = startWeekIdx; w < weeks.length; w++) {
      const { from, to } = weeks[w];
      const fromStr = from.toISOString().slice(0, 10);
      const toStr   = to.toISOString().slice(0, 10);

      process.stdout.write(`  Săpt ${w + 1}/${weeks.length} (${fromStr} → ${toStr})... `);

      const inserted = await syncWeek(from, to, source);
      grandTotal += inserted;

      console.log(`${inserted} (total ${source}: ${grandTotal})`);
      saveProgress(year, w + 1, source);

      await new Promise(r => setTimeout(r, 500));
    }

    saveProgress(year + 1, 0, source);
    console.log(`✅ ${source} — Anul ${year} complet`);
  }

  return grandTotal;
}

async function main() {
  const progress = loadProgress();

  console.log(`\n🚀 Import istoric SEAP — CAN + CN`);
  console.log(`   Progres curent: ${progress.source} — ${progress.lastYear} (săpt. ${progress.lastWeek})`);
  console.log(`   Ctrl+C oricând — reia de unde a rămas\n`);

  // Dacă am terminat CAN sau nu am început CN, facem CN
  if (progress.source === "CN") {
    // Continuăm CN de unde am rămas
    const total = await importSource("CN", progress.lastYear, progress.lastWeek);
    console.log(`\n✅ CN complet! Total: ${total}`);
  } else {
    // Mai întâi terminăm CAN dacă nu e gata, apoi facem CN
    if (progress.source === "CAN") {
      const canTotal = await importSource("CAN", progress.lastYear, progress.lastWeek);
      console.log(`\n✅ CAN complet! Total CAN: ${canTotal}`);
    }

    // Resetăm pentru CN și pornim
    saveProgress(2007, 0, "CN");
    const cnTotal = await importSource("CN", 2007, 0);
    console.log(`\n✅ CN complet! Total CN: ${cnTotal}`);
  }

  console.log(`\n🏁 Import complet finalizat!`);
}

main().catch(console.error);