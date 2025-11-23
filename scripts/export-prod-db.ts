import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";

const execAsync = promisify(exec);

// Load environment variables from .env file
async function loadEnvFile() {
  try {
    const envText = await fs.readFile(".env", "utf8");
    for (const line of envText.split(/\r?\n/)) {
      // Match DIRECT_URL or DATABASE_URL
      const directMatch = line.match(/^DIRECT_URL=(.*)$/);
      const dbMatch = line.match(/^DATABASE_URL=(.*)$/);
      
      if (directMatch) {
        let value = directMatch[1].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env.DIRECT_URL = value;
      }
      
      if (dbMatch) {
        let value = dbMatch[1].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env.DATABASE_URL = value;
      }
    }
  } catch (err) {
    // .env file might not exist, that's okay
  }
}

function redactDatabaseUrl(raw: string): string {
  try {
    const url = new URL(raw);
    if (url.username) url.username = "***";
    if (url.password) url.password = "***";
    return url.toString();
  } catch (err) {
    return raw.replace(/(:)([^:@]+)(@)/, "$1***$3");
  }
}

async function main() {
  // Load environment variables from .env file
  await loadEnvFile();
  
  // Use DIRECT_URL for pg_dump (Neon recommends direct connection for dumps)
  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error("ERROR: DIRECT_URL or DATABASE_URL is not set");
    console.error("Please set DIRECT_URL in your .env file for production database export");
    process.exit(1);
    return;
  }

  console.log("Exporting from:", redactDatabaseUrl(dbUrl));

  // Create output directory
  const outputDir = path.resolve(process.cwd(), "artifacts", "db-export");
  await fs.mkdir(outputDir, { recursive: true });

  // Generate timestamped filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const dumpFile = path.join(outputDir, `production-dump-${timestamp}.dump`);

  console.log(`[1/3] Starting database dump...`);
  console.log(`Output file: ${dumpFile}`);

  try {
    // Run pg_dump with custom format (compressed, includes schema + data)
    // --no-owner: don't output commands to set ownership
    // --no-privileges: don't output commands to set privileges
    // --blobs: include large objects
    // --verbose: show progress
    const { stdout, stderr } = await execAsync(
      `pg_dump "${dbUrl}" --format=custom --no-owner --no-privileges --blobs --verbose --file="${dumpFile}"`,
      {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
      }
    );

    if (stderr) {
      // pg_dump writes progress to stderr, which is normal
      console.log(stderr);
    }

    // Verify file was created
    const stats = await fs.stat(dumpFile);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`[2/3] Dump completed successfully`);
    console.log(`File size: ${sizeMB} MB`);
    console.log(`[3/3] Dump saved to: ${dumpFile}`);

    // Also create a SQL format dump for easier inspection (optional)
    const sqlFile = path.join(outputDir, `production-dump-${timestamp}.sql`);
    console.log(`\nCreating SQL format dump for inspection...`);
    
    const { stdout: sqlStdout, stderr: sqlStderr } = await execAsync(
      `pg_dump "${dbUrl}" --no-owner --no-privileges --blobs --file="${sqlFile}"`,
      {
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    if (sqlStderr) {
      console.log(sqlStderr);
    }

    const sqlStats = await fs.stat(sqlFile);
    const sqlSizeMB = (sqlStats.size / (1024 * 1024)).toFixed(2);
    console.log(`SQL dump size: ${sqlSizeMB} MB`);
    console.log(`SQL dump saved to: ${sqlFile}`);

    console.log("\n✅ Export complete!");
    console.log(`\nNext steps:`);
    console.log(`1. Review the dump file: ${dumpFile}`);
    console.log(`2. Run the import script: tsx scripts/import-local-db.ts ${dumpFile}`);

  } catch (error: any) {
    console.error("\n❌ Export failed!");
    console.error("Error:", error.message);
    
    if (error.stderr) {
      console.error("pg_dump stderr:", error.stderr);
    }
    
    // Clean up partial file if it exists
    try {
      await fs.access(dumpFile);
      await fs.unlink(dumpFile);
      console.log("Cleaned up partial dump file");
    } catch {
      // File doesn't exist, nothing to clean up
    }
    
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});

