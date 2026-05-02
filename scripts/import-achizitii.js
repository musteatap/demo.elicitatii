import { neon } from "@neondatabase/serverless";
import { readFileSync, writeFileSync, existsSync } from "fs";

const envFile = readFileSync(".env.local", "utf8");
const dbUrl   = envFile.match(/DATABASE_URL=(.+)/)[1].trim();
const sql     = neon(dbUrl);

const PROGRESS_FILE = "scripts/progress-achizitii.json";

function loadProgress() {
  if (existsSync(PROGRESS_FILE)) {
    return JSON.parse(readFileSync(PROGRESS_FILE, "utf8"));
  }
  return { lastYear: 2018, lastWeek: 0 };
}

function saveProgress(year, week) {
  writeFileSync(PROGRESS_FILE, JSON.stringify({ lastYear: year, lastWeek: week }));
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

async function syncWeek(from, to) {
  let pageIndex     = 0;
  let totalPages    = 1;
  let totalInserted = 0;

  while (pageIndex < totalPages) {
    const response = await fetch(
      "https://www.e-licitatie.ro/api-pub/DirectAcquisitionCommon/GetDirectAcquisitionList",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "Referer": "https://e-licitatie.ro/pub/direct-acquisitions/list",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        body: JSON.stringify({
          pageSize:                    200,
          pageIndex,
          showOngoingDa:               true,
          cookieContext:               null,
          sysDirectAcquisitionStateId: null,
          publicationDateStart:        from.toISOString(),
          publicationDateEnd:          to.toISOString(),
          finalizationDateStart:       null,
          finalizationDateEnd:         null,
        }),
      }
    );

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
        const cpvParts = item.cpvCode?.split(" - ") || [];
        const cpvCode  = cpvParts[0] || "";
        const cpvName  = cpvParts.slice(1).join(" - ").replace(/\s*\(Rev\.2\)/g, "") || "";

        await sql`
          INSERT INTO achizitii_directe (
            id, cod_unic, title, authority, supplier,
            cpv_code, cpv_name, state, value_ron,
            publication_date, finalization_date
          ) VALUES (
            ${item.directAcquisitionId},
            ${item.uniqueIdentificationCode},
            ${item.directAcquisitionName},
            ${item.contractingAuthority},
            ${item.supplier},
            ${cpvCode},
            ${cpvName},
            ${item.sysDirectAcquisitionState?.text},
            ${item.closingValue || item.estimatedValueRon || 0},
            ${item.publicationDate || null},
            ${item.finalizationDate || null}
          )
          ON CONFLICT (id) DO UPDATE SET
            state     = EXCLUDED.state,
            value_ron = EXCLUDED.value_ron
        `;
        totalInserted++;
      } catch (e) {
        // skip
      }
    }

    pageIndex++;
    await new Promise(r => setTimeout(r, 400));
  }

  return totalInserted;
}

async function main() {
  const progress  = loadProgress();
  const endYear   = new Date().getFullYear();

  console.log(`\n🚀 Import achiziții directe SEAP`);
  console.log(`   De la: ${progress.lastYear} (săpt. ${progress.lastWeek}) → ${endYear}`);
  console.log(`   Ctrl+C oricând — reia de unde a rămas\n`);

  let grandTotal = 0;

  for (let year = progress.lastYear; year <= endYear; year++) {
    const weeks      = getWeeks(year);
    const startWeek  = year === progress.lastYear ? progress.lastWeek : 0;

    console.log(`\n📅 Anul ${year} — ${weeks.length} săptămâni`);

    for (let w = startWeek; w < weeks.length; w++) {
      const { from, to } = weeks[w];
      const fromStr = from.toISOString().slice(0, 10);
      const toStr   = to.toISOString().slice(0, 10);

      process.stdout.write(`  Săpt ${w + 1}/${weeks.length} (${fromStr} → ${toStr})... `);

      const inserted = await syncWeek(from, to);
      grandTotal += inserted;

      console.log(`${inserted} (total: ${grandTotal})`);
      saveProgress(year, w + 1);

      await new Promise(r => setTimeout(r, 500));
    }

    saveProgress(year + 1, 0);
    console.log(`✅ Anul ${year} complet`);
  }

  console.log(`\n✅ Import complet! Total: ${grandTotal} achiziții directe`);
}

main().catch(console.error);