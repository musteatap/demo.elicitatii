export async function POST(req) {
  const body = await req.json();

  const response = await fetch(
    "https://www.e-licitatie.ro/api-pub/NoticeCommon/GetCNoticeList/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "Referer": "https://e-licitatie.ro/pub/notices/contract-notices/list/0/0",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    return Response.json({ error: `SEAP ${response.status}` }, { status: 502 });
  }

  const data = await response.json();
  return Response.json(data);
}