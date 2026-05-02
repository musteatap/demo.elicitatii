export async function GET() {
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
  	pageSize:                    5,
  	pageIndex:                   0,
  	showOngoingDa:               true,
  	cookieContext:               null,
  	sysDirectAcquisitionStateId: null,
  	publicationDateStart:        null,
  	publicationDateEnd:          null,
  	finalizationDateStart:       "2025-01-01T00:00:00.000Z",
  	finalizationDateEnd:         "2025-12-31T23:59:59.000Z",
      }),
    }
  );

  const data = await response.json();
  return Response.json({
    total: data.total,
    first_date: data.items?.[0]?.publicationDate,
    last_date:  data.items?.[data.items.length-1]?.publicationDate,
  });
}