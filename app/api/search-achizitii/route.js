import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const sql = neon(process.env.DATABASE_URL);
  const { searchParams } = new URL(req.url);

  const q      = (searchParams.get("q")     || "").trim();
  const state  = (searchParams.get("state") || "").trim();
  const sort   =  searchParams.get("sort")  || "date";
  const page   = parseInt(searchParams.get("page") || "0");
  const limit  = 50;
  const offset = page * limit;

  try {
    const conditions = [];
    if (q) {
      const safe = q.replace(/'/g, "''");
      conditions.push(
        `(title ILIKE '%${safe}%' OR authority ILIKE '%${safe}%' OR supplier ILIKE '%${safe}%' OR cpv_code ILIKE '%${safe}%' OR cod_unic ILIKE '%${safe}%')`
      );
    }
    if (state) conditions.push(`state = '${state.replace(/'/g, "''")}'`);

    const where   = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderBy = sort === "valoare"
      ? "value_ron DESC NULLS LAST"
      : "publication_date DESC NULLS LAST";

    const rows = await sql.query(
      `SELECT id, cod_unic, title, authority, supplier,
              cpv_code, cpv_name, state, value_ron,
              publication_date, finalization_date
       FROM achizitii_directe
       ${where}
       ORDER BY ${orderBy}
       LIMIT ${limit} OFFSET ${offset}`
    );

    const countRows = await sql.query(
      `SELECT COUNT(*)::int as total FROM achizitii_directe ${where}`
    );

    return Response.json({
      items:    rows,
      total:    countRows[0]?.total ?? 0,
      page,
      pageSize: limit,
    });

  } catch (err) {
    console.error("Search achizitii error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}