#!/usr/bin/env bash
# =============================================================
#  db/migrate.sh — применяет все новые SQL-миграции
#
#  Использование:
#    ./db/migrate.sh                        # из корня проекта
#    DATABASE_URL=postgresql://... ./db/migrate.sh
#
#  Порядок поиска подключения (первый найденный побеждает):
#    1. Переменная окружения DATABASE_URL
#    2. PG_LINK из server/.env.local
#    3. PG_LINK из server/.env
# =============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/migrations"

BOLD='\033[1m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
RED='\033[1;31m'
RESET='\033[0m'

log()  { echo -e "${BOLD}[migrate]${RESET} $*"; }
ok()   { echo -e "${GREEN}[migrate]${RESET} $*"; }
warn() { echo -e "${YELLOW}[migrate]${RESET} $*"; }
err()  { echo -e "${RED}[migrate]${RESET} $*" >&2; exit 1; }

# ── Определяем DATABASE_URL ───────────────────────────────────
if [[ -z "${DATABASE_URL:-}" ]]; then
  ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

  for env_file in "$ROOT/server/.env.local" "$ROOT/server/.env"; do
    if [[ -f "$env_file" ]]; then
      val="$(grep -E '^PG_LINK=' "$env_file" | head -1 | cut -d= -f2-)"
      if [[ -n "$val" ]]; then
        DATABASE_URL="$val"
        log "Используем подключение из $env_file"
        break
      fi
    fi
  done
fi

[[ -z "${DATABASE_URL:-}" ]] && err "DATABASE_URL не задан и PG_LINK не найден в server/.env(.local)"

export PGPASSWORD
PGPASSWORD="$(echo "$DATABASE_URL" | sed -E 's|.*://[^:]+:([^@]+)@.*|\1|')"
PSQL_ARGS=( --no-password -d "$DATABASE_URL" -v ON_ERROR_STOP=1 )

psql_run() { psql "${PSQL_ARGS[@]}" "$@"; }

# ── Проверяем psql ────────────────────────────────────────────
command -v psql &>/dev/null || err "psql не найден. Установи postgresql-client."

# ── Создаём таблицу миграций (если ещё нет) ───────────────────
log "Инициализируем таблицу schema_migrations..."
psql_run -c "
CREATE TABLE IF NOT EXISTS schema_migrations (
  filename   TEXT        PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
" > /dev/null

# ── Применяем миграции ────────────────────────────────────────
applied=0
skipped=0

for file in $(ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort); do
  filename="$(basename "$file")"

  already="$(psql_run -tAc "SELECT 1 FROM schema_migrations WHERE filename = '$filename';")"

  if [[ "$already" == "1" ]]; then
    skipped=$((skipped + 1))
    continue
  fi

  log "Применяем $filename ..."
  psql_run -f "$file" > /dev/null
  psql_run -c "INSERT INTO schema_migrations (filename) VALUES ('$filename');" > /dev/null
  ok "$filename — применена"
  applied=$((applied + 1))
done

if [[ "$applied" -eq 0 ]]; then
  ok "Всё актуально (пропущено: $skipped)"
else
  ok "Применено: $applied, пропущено: $skipped"
fi
