#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  dev.local.sh — запуск всего проекта локально
#  Использование: ./dev.local.sh [--no-docker]
# ─────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Цвета
BOLD='\033[1m'
CYAN='\033[1;36m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
RED='\033[1;31m'
RESET='\033[0m'

log()  { echo -e "${BOLD}[dev]${RESET} $*"; }
ok()   { echo -e "${GREEN}[dev]${RESET} $*"; }
warn() { echo -e "${YELLOW}[dev]${RESET} $*"; }
err()  { echo -e "${RED}[dev]${RESET} $*" >&2; }

# ── PIDs дочерних процессов ───────────────────────────────────
PIDS=()

cleanup() {
  echo ""
  log "Остановка сервисов..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  # Останавливаем Docker, если мы его запускали
  if [[ "${STARTED_DOCKER:-0}" == "1" ]]; then
    log "Останавливаем postgres..."
    docker compose -f "$ROOT/docker-compose.yml" stop postgres 2>/dev/null || true
  fi
  ok "Готово."
}
trap cleanup EXIT INT TERM

# ── Аргументы ────────────────────────────────────────────────
SKIP_DOCKER=0
for arg in "$@"; do
  [[ "$arg" == "--no-docker" ]] && SKIP_DOCKER=1
done

# ── 1. Docker / PostgreSQL ────────────────────────────────────
if [[ "$SKIP_DOCKER" == "0" ]]; then
  if ! command -v docker &>/dev/null; then
    err "Docker не найден. Установи Docker Desktop или передай --no-docker."
    exit 1
  fi

  log "Запуск PostgreSQL..."
  docker compose -f "$ROOT/docker-compose.yml" up -d postgres

  STARTED_DOCKER=1

  # Ждём готовности БД (до 30 с)
  log "Ожидаем готовности PostgreSQL..."
  for i in $(seq 1 30); do
    if docker compose -f "$ROOT/docker-compose.yml" exec -T postgres \
         pg_isready -U postgres -d myshop &>/dev/null; then
      ok "PostgreSQL готов (${i}s)."
      break
    fi
    if [[ "$i" == "30" ]]; then
      err "PostgreSQL не стартовал за 30 секунд."
      exit 1
    fi
    sleep 1
  done
fi

# ── 2. Вспомогательная функция запуска ───────────────────────
# run_service <label> <color> <cwd> <command>
run_service() {
  local label="$1" color="$2" cwd="$3"
  shift 3
  local cmd=("$@")

  (
    cd "$cwd"
    # Построчно выводим с цветным префиксом
    "${cmd[@]}" 2>&1 | while IFS= read -r line; do
      echo -e "${color}[${label}]${RESET} ${line}"
    done
  ) &

  PIDS+=($!)
}

# ── 3. Проверяем node_modules ─────────────────────────────────
for dir in server admin client; do
  if [[ ! -d "$ROOT/$dir/node_modules" ]]; then
    warn "node_modules отсутствует в $dir, устанавливаем..."
    (cd "$ROOT/$dir" && npm install)
    ok "$dir: зависимости установлены."
  fi
done

# ── 4. Запуск сервисов ───────────────────────────────────────
log "Запуск сервисов..."

run_service "server" "${CYAN}"  "$ROOT/server" npm run dev
run_service "admin"  "${YELLOW}" "$ROOT/admin"  npm run dev
run_service "client" "${GREEN}" "$ROOT/client" npm run dev

echo ""
echo -e "${BOLD}─────────────────────────────────────────${RESET}"
echo -e "  ${CYAN}server${RESET}  → http://localhost:8080"
echo -e "  ${YELLOW}admin${RESET}   → http://localhost:8090"
echo -e "  ${GREEN}client${RESET}  → http://localhost:5173"
echo -e "${BOLD}─────────────────────────────────────────${RESET}"
echo -e "  Ctrl+C — остановить всё"
echo ""

# Ждём, пока не умрёт один из дочерних процессов
wait "${PIDS[@]}"
