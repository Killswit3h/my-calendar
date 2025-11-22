import { PrismaClient } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();

async function getTableNames(schema = "public") {
  const rows = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = ${schema}
      AND table_type = 'BASE TABLE'
    ORDER BY table_name ASC;
  `;
  return rows.map((row) => row.table_name);
}

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    return value.toISOString();
  }
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function rowsToCsv(rows: any[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const headerLine = headers.map((key) => escapeCsvValue(key)).join(",");
  const dataLines = rows.map((row) => headers.map((key) => escapeCsvValue(row[key])).join(","));
  return [headerLine, ...dataLines].join("\n");
}

async function exportTable(tableName: string, outputDir: string) {
  const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "${tableName}"`);
  const csv = rowsToCsv(rows);
  const outputPath = path.join(outputDir, `${tableName}.csv`);
  await fs.writeFile(outputPath, csv, "utf8");
  console.log(`Exported ${rows.length} row(s) from ${tableName} -> ${outputPath}`);
}

async function main() {
  const outputDir = path.resolve(process.cwd(), "artifacts", "db-export");
  await fs.mkdir(outputDir, { recursive: true });

  const tables = await getTableNames();
  for (const table of tables) {
    await exportTable(table, outputDir);
  }
  console.log("All tables exported.");
}

main()
  .catch((error) => {
    console.error("Failed to export tables", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

