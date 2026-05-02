import { neon } from "@neondatabase/serverless";

export async function GET(req) {
  const sql = neon(process.env.DATABASE_URL);
  const { searchParams } = new URL(req.url);

  const from = searchParams.get("from");
  const to   = searchParams.get("to");

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
  	  publicationDateStart:        startDate.toISOString(),
  	  publicationDateEnd:          endDate.toISOString(),
  	  finalizationDateStart:       null,
  	  finalizationDateEnd:         null,
        }),
      }
    );

    if (!response.ok) {
      return Response.json({ error: `SEAP ${response.status}` }, { status: 502 });
    }

    const data  = await response.json();
    const items = data.items || [];

    if (pageIndex === 0) {
      totalPages = Math.ceil((data.total || 0) / 200);
      console.log(`Total achizitii: ${data.total} → ${totalPages} pagini`);
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
        totalSkipped++;
      }
    }

    pageIndex++;
    await new Promise(r => setTimeout(r, 400));
  }

  return Response.json({
    ok: true,
    from: startDate.toISOString().slice(0, 10),
    to:   endDate.toISOString().slice(0, 10),
    totalInserted,
    totalSkipped,
    totalPages,
  });
}