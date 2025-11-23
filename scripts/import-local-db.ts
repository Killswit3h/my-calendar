import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";

const execAsync = promisify(exec);

// Local database connection string (from docker-compose.yml)
const LOCAL_DB_URL = "postgresql://user:password@localhost:5432/db";

async function checkDockerRunning(): Promise<boolean> {
  try {
    await execAsync("docker compose ps db");
    return true;
  } catch {
    return false;
  }
}

async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await execAsync(`psql "${LOCAL_DB_URL}" -Atc "SELECT 1;"`);
    return true;
  } catch {
    return false;
  }
}

async function ensureExtensions() {
  console.log("[1/5] Ensuring required extensions exist...");
  try {
    // Create extensions that might be needed
    await execAsync(
      `psql "${LOCAL_DB_URL}" -v ON_ERROR_STOP=1 -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"`
    );
    try {
      await execAsync(
        `psql "${LOCAL_DB_URL}" -v ON_ERROR_STOP=1 -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"`
      );
    } catch {
      // uuid-ossp might not be available, that's okay
    }
    console.log("✓ Extensions ready");
  } catch (error: any) {
    // Some extensions might not be available, that's okay
    console.log("Note: Some extensions may not be available (this is usually fine)");
  }
}

async function findLatestDump(dumpDir: string): Promise<string | null> {
  try {
    const files = await fs.readdir(dumpDir);
    const dumpFiles = files
      .filter((f) => f.endsWith(".dump") || f.endsWith(".sql"))
      .map((f) => ({
        name: f,
        path: path.join(dumpDir, f),
      }));

    if (dumpFiles.length === 0) return null;

    // Sort by modification time, newest first
    const stats = await Promise.all(
      dumpFiles.map(async (f) => ({
        ...f,
        mtime: (await fs.stat(f.path)).mtime,
      }))
    );

    stats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    return stats[0].path;
  } catch {
    return null;
  }
}

async function importDump(dumpFile: string) {
  const isSqlFormat = dumpFile.endsWith(".sql");

  if (isSqlFormat) {
    console.log("[4/5] Importing SQL dump (this may take a while)...");
    const { stdout, stderr } = await execAsync(
      `psql "${LOCAL_DB_URL}" --file="${dumpFile}"`,
      {
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large SQL files
      }
    );

    if (stderr && !stderr.includes("already exists")) {
      // Some errors are expected (like "relation already exists")
      console.log("Note: Some warnings may appear (this is usually fine)");
    }
  } else {
    console.log("[4/5] Importing custom format dump (this may take a while)...");
    const { stdout, stderr } = await execAsync(
      `pg_restore --no-owner --no-privileges --clean --if-exists --verbose --jobs=4 --dbname="${LOCAL_DB_URL}" "${dumpFile}"`,
      {
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer
      }
    );

    if (stderr) {
      // pg_restore writes progress to stderr, which is normal
      console.log(stderr);
    }
  }

  console.log("✓ Import completed");
}

async function verifyImport() {
  console.log("[5/5] Verifying import...");
  try {
    // Check if Event table exists and has data
    const { stdout } = await execAsync(
      `psql "${LOCAL_DB_URL}" -Atc 'SELECT COUNT(*) FROM "Event";'`
    );
    const eventCount = parseInt(stdout.trim(), 10);
    console.log(`✓ Event table has ${eventCount} row(s)`);

    // Check a few other key tables
    const tables = ["Calendar", "Employee", "Project", "Customer"];
    for (const table of tables) {
      try {
        const { stdout } = await execAsync(
          `psql "${LOCAL_DB_URL}" -Atc 'SELECT COUNT(*) FROM "${table}";'`
        );
        const count = parseInt(stdout.trim(), 10);
        console.log(`✓ ${table} table has ${count} row(s)`);
      } catch {
        // Table might not exist, that's okay
      }
    }
  } catch (error: any) {
    console.log("Note: Could not verify all tables (this may be normal)");
  }
}

async function main() {
  // Get dump file from command line argument or find latest
  const dumpFileArg = process.argv[2];
  let dumpFile: string;

  if (dumpFileArg) {
    dumpFile = path.resolve(dumpFileArg);
  } else {
    // Find latest dump in artifacts/db-export
    const dumpDir = path.resolve(process.cwd(), "artifacts", "db-export");
    const latest = await findLatestDump(dumpDir);
    if (!latest) {
      console.error("ERROR: No dump file found");
      console.error("Usage: tsx scripts/import-local-db.ts [path-to-dump-file]");
      console.error(
        "Or place a .dump or .sql file in artifacts/db-export/ and run without arguments"
      );
      process.exit(1);
      return;
    }
    dumpFile = latest;
    console.log(`Using latest dump file: ${dumpFile}`);
  }

  // Verify dump file exists
  try {
    await fs.access(dumpFile);
  } catch {
    console.error(`ERROR: Dump file not found: ${dumpFile}`);
    process.exit(1);
    return;
  }

  console.log(`\n📦 Importing database dump: ${path.basename(dumpFile)}`);
  console.log(`Target: local PostgreSQL (${LOCAL_DB_URL.replace(/:[^:]*@/, ":***@")})\n`);

  // Check if Docker is running
  console.log("[0/5] Checking prerequisites...");
  const dockerRunning = await checkDockerRunning();
  if (!dockerRunning) {
    console.error("ERROR: Docker container 'db' is not running");
    console.error("Please start it with: docker compose up -d db");
    process.exit(1);
    return;
  }
  console.log("✓ Docker container is running");

  // Check database connection
  const dbConnected = await checkDatabaseConnection();
  if (!dbConnected) {
    console.error("ERROR: Cannot connect to local database");
    console.error("Please ensure:");
    console.error("1. Docker container is running: docker compose up -d db");
    console.error("2. Database is ready (wait a few seconds after starting)");
    process.exit(1);
    return;
  }
  console.log("✓ Database connection successful");

  try {
    await ensureExtensions();
    await importDump(dumpFile);
    await verifyImport();

    console.log("\n✅ Import complete!");
    console.log("\nNext steps:");
    console.log("1. Update your .env.local with: DATABASE_URL=postgresql://user:password@localhost:5432/db");
    console.log("2. Run Prisma migrations: npx prisma migrate deploy");
    console.log("3. Generate Prisma client: npx prisma generate");
    console.log("4. Test the connection: npm run db:whoami");
  } catch (error: any) {
    console.error("\n❌ Import failed!");
    console.error("Error:", error.message);

    if (error.stderr) {
      console.error("\npg_restore/psql stderr:", error.stderr);
    }

    console.error("\nTroubleshooting:");
    console.error("1. Ensure Docker container is running: docker compose ps");
    console.error("2. Check database logs: docker compose logs db");
    console.error("3. Try resetting the database: docker compose down -v && docker compose up -d db");

    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});

