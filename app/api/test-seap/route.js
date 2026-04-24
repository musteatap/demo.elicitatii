export async function GET() {
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
 	 pageSize:               5,
  	 pageIndex:              0,
  	 hasUnansweredQuestions: false,
 	 startPublicationDate:   "2024-01-01T00:00:00.000Z",
  	 endPublicationDate:     "2024-12-31T23:59:59.000Z",
      }),
    }
  );

  const data = await response.json();
  return Response.json({
    total: data.total,
    items: data.items?.slice(0, 3).map(i => ({
      id:        i.caNoticeId,
      authority: i.contractingAuthorityNameAndFN,
      title:     i.contractTitle,
      date:      i.noticeStateDate,
    }))
  });
}