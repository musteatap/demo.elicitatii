export async function POST(req) {
  try {
    const body = await req.json();

    const response = await fetch(
      "https://www.e-licitatie.ro/api-pub/NoticeCommon/GetCANoticeList",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "Referer": "https://e-licitatie.ro/pub/notices/contract-notices/list/0/0",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      return Response.json(
        { error: `e-licitatie a raspuns cu ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (err) {
    return Response.json(
      { error: "Eroare la conectarea cu e-licitatie.ro: " + err.message },
      { status: 500 }
    );
  }
}
