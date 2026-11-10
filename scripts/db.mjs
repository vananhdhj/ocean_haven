// Runs the T-SQL scripts in database/sqlserver against SQL Server.
//
//   npm run db:setup              -> 01_schema.sql ... 07_seed.sql (drops and recreates all tables)
//   npm run db:test               -> tests/test_business_logic.sql
//   npm run db:run -- <file.sql>  -> any single script, e.g. tests/index_demo.sql
//
// Files are split on "GO" lines exactly like SSMS / sqlcmd, so they can also be
// opened and executed in SSMS or Azure Data Studio unchanged.
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import sql from "mssql";

const SQL_DIR = resolve(import.meta.dirname, "../database/sqlserver");

const config = {
  server: process.env.MSSQL_HOST || "localhost",
  port: Number(process.env.MSSQL_PORT || 1433),
  user: process.env.MSSQL_USER || "sa",
  password: process.env.MSSQL_PASSWORD,
  database: "master", // scripts switch to OceanHaven with USE
  options: { encrypt: true, trustServerCertificate: true },
  // One connection, so USE <db> in one batch applies to the following batches.
  pool: { min: 1, max: 1 },
  requestTimeout: 120_000,
};

function splitBatches(text) {
  return text
    .split(/^\s*GO\s*$/im)
    .map((batch) => batch.trim())
    .filter(Boolean);
}

async function runFile(pool, file) {
  console.log(`\n▶ ${file.replace(SQL_DIR + "/", "")}`);
  for (const batch of splitBatches(readFileSync(file, "utf8"))) {
    const request = pool.request();
    request.on("info", (info) => console.log(`  ${info.message}`));
    const result = await request.batch(batch);
    for (const recordset of result.recordsets ?? []) {
      if (recordset.length) console.table(recordset);
    }
  }
}

async function main() {
  const [command, arg] = process.argv.slice(2);
  if (!config.password) {
    throw new Error("MSSQL_PASSWORD is not set (add it to .env.local).");
  }

  let files;
  if (command === "setup") {
    files = readdirSync(SQL_DIR)
      .filter((f) => /^\d\d_.*\.sql$/.test(f))
      .sort()
      .map((f) => join(SQL_DIR, f));
  } else if (command === "test") {
    files = [join(SQL_DIR, "tests/test_business_logic.sql")];
  } else if (command === "run" && arg) {
    files = [resolve(SQL_DIR, arg)];
  } else {
    console.log("Usage: node scripts/db.mjs setup | test | run <file.sql>");
    process.exit(1);
  }

  const pool = await new sql.ConnectionPool(config).connect();
  try {
    for (const file of files) await runFile(pool, file);
    console.log("\n✔ Done");
  } finally {
    await pool.close();
  }
}

main().catch((err) => {
  console.error(`\n✖ ${err.message}`);
  process.exit(1);
});
