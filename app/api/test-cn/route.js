export async function GET() {
  const response = await fetch(
    "https://www.e-licitatie.ro/api-pub/NoticeCommon/GetCNoticeList/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        "Referer": "https://e-licitatie.ro/pub/notices/contract-notices/list/0/0",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: JSON.stringify({
        sysNoticeTypeIds: [],
        sortProperties:   [],
        pageSize:         5,
        pageIndex:        0,
        hasUnansweredQuestions: false,
      }),
    }
  );

  const data = await response.json();
  return Response.json({
    total: data.total,
   sample: data.items?.slice(0, 1).map(i => ({
  caNoticeId:  i.caNoticeId,
  noticeId:    i.noticeId,
  procedureId: i.procedureId,
  notice_no:   i.noticeNo,
}))
  });
}