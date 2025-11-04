import { computeFinanceRows } from "../src/lib/finance/compute";

async function main() {
  const rows = await computeFinanceRows();
  console.log(JSON.stringify(rows.slice(0, 10), null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
