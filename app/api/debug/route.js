import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = neon(process.env.DATABASE_URL);
  
  const result = await sql`SELECT COUNT(*) as total FROM licitatii`;
  const sample = await sql`SELECT id FROM licitatii ORDER BY id DESC LIMIT 5`;
  
  return Response.json({
    count: result[0].total,
    last5ids: sample.map(r => r.id),
    db_url_preview: process.env.DATABASE_URL?.slice(0, 40) + "..."
  });
}