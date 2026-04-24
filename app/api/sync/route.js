import { neon } from "@neondatabase/serverless";

export async function GET(req) {
  const sql = neon(process.env.DATABASE_URL);
  const { searchParams } = new URL(req.url);

  const from   = searchParams.get("from");
  const to     = searchParams.get("to");
  const source = searchParams.get("source") || "CAN";

  const endpoint = source === "CN"
    ? "https://www.e-licitatie.ro/api-pub/NoticeCommon/GetCNoticeList/"
    : "https://www.e-licitatie.ro/api-pub/NoticeCommon/GetCANoticeList";

  // Dacă nu e specificat interval, luăm ziua de ieri
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = from ? new Date(from) : yesterday;
  const endDate   = to   ? new Date(to)   : today;

  let pageIndex     = 0;
  let totalInserted = 0;
  let totalSkipped  = 0;
  let totalPages    = 1;

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
        startPublicationDate:   startDate.toISOString(),
        endPublicationDate:     endDate.toISOString(),
      }),
    });

    if (!response.ok) {
      return Response.json({ error: `SEAP ${response.status}` }, { status: 502 });
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
            notice_date     = EXCLUDED.notice_date
        `;
        totalInserted++;
      } catch (e) {
        totalSkipped++;
      }
    }

    pageIndex++;
    await new Promise(r => setTimeout(r, 300));
  }

  return Response.json({
    ok: true,
    source,
    from: startDate.toISOString().slice(0, 10),
    to:   endDate.toISOString().slice(0, 10),
    totalInserted,
    totalSkipped,
    totalPages,
  });
}