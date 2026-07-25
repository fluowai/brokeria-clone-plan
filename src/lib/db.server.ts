import pg from "pg";

const url = process.env.DATABASE_URL;

let pool: pg.Pool | null = null;

export function db(): pg.Pool {
  if (!pool) {
    if (!url) throw new Error("DATABASE_URL is not set");
    pool = new pg.Pool({
      connectionString: url,
      max: 10,
      idleTimeoutMillis: 30_000,
    });
  }
  return pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
  const res = await db().query(text, params);
  return { rows: res.rows as T[], rowCount: res.rowCount ?? 0 };
}

export async function one<T = any>(text: string, params?: any[]): Promise<T | null> {
  const { rows } = await query<T>(text, params);
  return rows[0] ?? null;
}
