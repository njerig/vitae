# Vitae local Postgres
You will need docker and Postgres installed
```bash
brew install postgresql@15
```
visit https://docs.docker.com/desktop/setup/install/mac-install/ to install on macOS

## Files
- `infra/docker-compose.yml` - runs Postgres locally
- `infra/initdb/001_schema.sql` - schema (tables/indexes)
- `infra/initdb/010_seed.sql` - optional demo rows, we can delete it
- `infra/dump.sql` - has my example data run:
```bash
cat dump.sql | docker exec -i vitae-db psql -U vitae -d vitae_dev
```
to get data. The data lives inside the docker volume that starts up with the compose command. When you initialize it you will have a fresh volume that has just seed data. This command will inject the data into your volume. If you add data to your local docker volume and want to "migrate" it, just run
```bash
docker exec -t vitae-db pg_dump -U vitae -d vitae_dev > dump.sql
```
This will dump your data into this file, and commit it to git for everyone else to pull.

## Start the DB (first time)
From `infra/`:
```bash
docker compose up -d
```

## Connection string
```bash
postgresql://vitae:vitae@localhost:5432/vitae_dev
```

## Apply schema changes (dev reset)
Init scripts run only when the DB volume is fresh *THIS IS ONLY IF WE CHANGE THE SCHEMA*:
```bash
docker compose down -v
docker compose up -d
```
Else just do
```bash
docker compose down
```
to stop the volume from running, it will not delete the data from your local

## Notes
- Delete `infra/initdb/010_seed.sql` if you don't want demo data.
