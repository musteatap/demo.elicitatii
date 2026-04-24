import { neon } from "@neondatabase/serverless";

export async function GET() {
  const sql = neon(process.env.DATABASE_URL);

  await sql`
    CREATE TABLE IF NOT EXISTS licitatii (
      id              BIGINT PRIMARY KEY,
      notice_no       TEXT,
      title           TEXT,
      authority       TEXT,
      contract_type   TEXT,
      procedure_type  TEXT,
      procedure_state TEXT,
      cpv_code        TEXT,
      cpv_name        TEXT,
      value_ron       NUMERIC,
      currency        TEXT,
      is_online       BOOLEAN,
      notice_date     TIMESTAMPTZ,
      raw             JSONB,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_licitatii_title
      ON licitatii USING gin(to_tsvector('simple', title))
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_licitatii_authority
      ON licitatii (authority)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_licitatii_date
      ON licitatii (notice_date DESC)
  `;

  return Response.json({ ok: true, message: "Tabele create cu succes!" });
}