import { neon } from "@neondatabase/serverless";

export const maxDuration = 60; // Vercel Pro permite mai mult, dar mergem cu 60s

export async function GET(req) {
  const sql = neon(process.env.DATABASE_URL);
  const { searchParams } = new URL(req.url);

  const year = parseInt(searchParams.get("year") || new Date().getFullYear());

  const startYear = new Date(`${year}-01-01`);
  const endYear   = new Date(`${year}-12-31`);

  let totalInserted = 0;
  let totalSkipped  = 0;
  let weeksDone     = 0;

  // Parcurgem saptamana cu saptamana
  let cursor = new Date(startYear);

  while (cursor <= endYear) {
    const from = new Date(cursor);
    const to   = new Date(cursor);
    to.setDate(to.getDate() + 6);
    if (to > endYear) to.setTime(endYear.getTime());

    let pageIndex  = 0;
    let totalPages = 1;

    while (pageIndex < totalPages) {
      try {
        const response = await fetch(
          "https://www.e-licitatie.ro/api-pub/NoticeCommon/GetCANoticeList",
          {
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
          }
        );

        if (!response.ok) {
          console.error(`SEAP ${response.status} pentru ${from.toISOString()}`);
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

            await sql`
              INSERT INTO licitatii (
                id, notice_no, title, authority,
                contract_type, procedure_type, procedure_state,
                cpv_code, cpv_name, value_ron, currency,
                is_online, notice_date
              ) VALUES (
                ${item.caNoticeId},
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
                ${item.noticeStateDate || null}
              )
              ON CONFLICT (id) DO UPDATE SET
                procedure_state = EXCLUDED.procedure_state,
                value_ron       = EXCLUDED.value_ron,
                notice_date     = EXCLUDED.notice_date
            `;
            totalInserted++;
          } catch (e) {
            totalSkipped++;
          }
        }

        pageIndex++;
        await new Promise(r => setTimeout(r, 300));

      } catch (e) {
        console.error("Eroare saptamana:", e.message);
        break;
      }
    }

    weeksDone++;
    cursor.setDate(cursor.getDate() + 7);
  }

  return Response.json({
    ok:   true,
    year,
    weeksDone,
    totalInserted,
    totalSkipped,
  });
}