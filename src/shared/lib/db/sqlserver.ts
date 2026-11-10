import "server-only";
import sql from "mssql";

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as {
  mssqlPool?: Promise<sql.ConnectionPool>;
};

function getPool(): Promise<sql.ConnectionPool> {
  if (!globalForDb.mssqlPool) {
    globalForDb.mssqlPool = new sql.ConnectionPool({
      server: process.env.MSSQL_HOST || "localhost",
      port: Number(process.env.MSSQL_PORT || 1433),
      user: process.env.MSSQL_USER || "sa",
      password: process.env.MSSQL_PASSWORD || "",
      database: process.env.MSSQL_DATABASE || "OceanHaven",
      options: { encrypt: true, trustServerCertificate: true },
    })
      .connect()
      .catch((err) => {
        globalForDb.mssqlPool = undefined; // retry on the next call
        throw err;
      });
  }
  return globalForDb.mssqlPool;
}

/**
 * Executes a stored procedure and returns its result sets.
 * Parameters are named without "@"; undefined values are skipped so the
 * procedure's default applies.
 */
export async function execProc<T = Record<string, unknown>>(
  name: string,
  params: Record<string, unknown> = {}
): Promise<T[][]> {
  const pool = await getPool();
  const request = pool.request();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) request.input(key, value);
  }
  const result = await request.execute(name);
  return result.recordsets as unknown as T[][];
}
