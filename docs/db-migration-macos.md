# Neon → Neon copy on macOS

## 0) Install client tools
```bash
brew install libpq && brew link --force libpq
psql --version
pg_dump --version
pg_restore --version
1) Run the migration
./scripts/migrate-neon.sh
2) Verify the running app DB
Open /api/diag/db. Compare db_url_sha256 across environments. Ensure Event/Employee/Project/EventAssignment counts are expected.
3) Switch app to destination
Set .env to the DST URL and restart your deployment.
