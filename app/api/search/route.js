import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const sql = neon(process.env.DATABASE_URL);
  const { searchParams } = new URL(req.url);

  const q     = (searchParams.get("q")     || "").trim();
  const type  = (searchParams.get("type")  || "").trim();
  const state = (searchParams.get("state") || "").trim();
  const sort  =  searchParams.get("sort")  || "date";
  const page  = parseInt(searchParams.get("page") || "0");
  const limit = 50;
  const offset = page * limit;
  const an     = (searchParams.get("an")      || "").trim();
  const valMin = (searchParams.get("val_min") || "").trim();
  const valMax = (searchParams.get("val_max") || "").trim();

  try {
    // Construim WHERE ca string — evităm SQL injection cu replace simplu
    const conditions = [];
    if (q) {
      const safe = q.replace(/'/g, "''");
      conditions.push(
        `(title ILIKE '%${safe}%' OR authority ILIKE '%${safe}%' OR notice_no ILIKE '%${safe}%' OR cpv_code ILIKE '%${safe}%' OR cpv_name ILIKE '%${safe}%')`
      );
    }
    if (type)  conditions.push(`contract_type = '${type.replace(/'/g, "''")}'`);
    if (state) conditions.push(`procedure_state = '${state.replace(/'/g, "''")}'`);
    if (an)     conditions.push(`EXTRACT(YEAR FROM notice_date) = ${parseInt(an)}`);
    if (valMin) conditions.push(`value_ron >= ${parseFloat(valMin)}`);
    if (valMax) conditions.push(`value_ron <= ${parseFloat(valMax)}`);

    const where   = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderBy = sort === "valoare"
      ? "value_ron DESC NULLS LAST"
      : "notice_date DESC NULLS LAST";

    // Folosim sql.query() pentru SELECT (returnează array direct)
    const rows = await sql.query(
      `SELECT id, notice_no, title, authority, contract_type, procedure_type,
              procedure_state, cpv_code, cpv_name, value_ron, currency,
              is_online, notice_date, notice_source
       FROM licitatii
       ${where}
       ORDER BY ${orderBy}
       LIMIT ${limit} OFFSET ${offset}`
    );

    // Folosim tagged template pentru COUNT (mai fiabil pentru numere mari)
    // dar construim where separat ca string
    const countRows = await sql.query(
      `SELECT COUNT(*)::int as total FROM licitatii ${where}`
    );

    return Response.json({
      items: rows,
      total: countRows[0]?.total ?? 0,
      page,
      pageSize: limit,
    });

  } catch (err) {
    console.error("Search error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
