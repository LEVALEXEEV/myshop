#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  deploy.sh — деплой на продакшн-сервер
#  Запускать на сервере: bash /var/www/myshop/deploy.sh
#
#  Требования на сервере:
#    git, node, npm, nginx
#    systemd-сервисы: myshop-server, myshop-admin
# ─────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="/var/www/myshop"
BRANCH="${DEPLOY_BRANCH:-main}"

SERVER_PORT="${SERVER_PORT:-3000}"
ADMIN_PORT="${ADMIN_PORT:-3001}"
# Сколько секунд ждём, пока сервис поднимется после restart
STARTUP_TIMEOUT=15

BOLD='\033[1m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
RED='\033[1;31m'
RESET='\033[0m'

log()  { echo -e "${BOLD}[deploy]${RESET} $*"; }
ok()   { echo -e "${GREEN}[deploy]${RESET} $*"; }
warn() { echo -e "${YELLOW}[deploy]${RESET} $*"; }
err()  { echo -e "${RED}[deploy]${RESET} $*" >&2; exit 1; }

cd "$APP_DIR"

# ── 0. Убиваем любые «дикие» процессы на портах ──────────────
# Защита от процессов, запущенных вне systemd (node вручную, pm2 и т.п.)
kill_orphans() {
  local port="$1"
  local pids
  pids=$(ss -tlnp "sport = :${port}" 2>/dev/null \
    | grep -oP 'pid=\K[0-9]+' || true)
  if [[ -n "$pids" ]]; then
    warn "Порт ${port} занят (PID: ${pids}). Принудительно завершаем..."
    # shellcheck disable=SC2086
    kill -TERM $pids 2>/dev/null || true
    sleep 2
    kill -KILL $pids 2>/dev/null || true
  fi
}

# ── 1. Git ────────────────────────────────────────────────────
log "Получаем изменения из origin/$BRANCH..."
git fetch origin
git reset --hard "origin/$BRANCH"
ok "Код обновлён: $(git log -1 --pretty='%h %s')"

# ── 2. Зависимости ───────────────────────────────────────────
log "Устанавливаем зависимости server..."
(cd "$APP_DIR/server" && npm ci --omit=dev)

log "Устанавливаем зависимости admin..."
(cd "$APP_DIR/admin" && npm ci --omit=dev)

log "Устанавливаем зависимости client..."
(cd "$APP_DIR/client" && npm ci)

# ── 3. Сборка фронтенда ───────────────────────────────────────
log "Собираем клиент..."
(cd "$APP_DIR/client" && npm run build)
ok "Сборка клиента завершена → client/dist/"

# ── 4. Перезапуск сервисов ────────────────────────────────────
# daemon-reload на случай, если unit-файлы менялись
sudo systemctl daemon-reload

restart_service() {
  local svc="$1"
  local port="$2"

  log "Останавливаем $svc..."
  sudo systemctl stop "$svc" || true

  # Убиваем всё, что осталось на порту (запущенное вне systemd)
  kill_orphans "$port"

  log "Запускаем $svc..."
  sudo systemctl start "$svc"

  # Ждём, пока сервис реально поднимется и начнёт слушать порт
  local elapsed=0
  while ! ss -tlnp "sport = :${port}" 2>/dev/null | grep -q ":${port}"; do
    if (( elapsed >= STARTUP_TIMEOUT )); then
      err "$svc не поднялся за ${STARTUP_TIMEOUT}с. Лог: journalctl -u $svc -n 50 --no-pager"
    fi
    sleep 1
    (( elapsed++ ))
  done

  ok "$svc слушает порт ${port} (через ${elapsed}с)"
}

restart_service myshop-server "$SERVER_PORT"
restart_service myshop-admin  "$ADMIN_PORT"

# ── 5. Перезагружаем nginx (подхватывает новый dist) ─────────
log "Перезагружаем nginx..."
sudo nginx -t || err "Конфиг nginx невалиден — перезагрузка отменена"
sudo systemctl reload nginx
ok "nginx перезагружен"

# ── 6. Финальная проверка состояния ──────────────────────────
log "Финальная проверка..."
for svc in myshop-server myshop-admin; do
  state=$(systemctl is-active "$svc" 2>/dev/null || true)
  if [[ "$state" == "active" ]]; then
    ok "$svc — running"
  else
    # Показываем лог и выходим с ошибкой
    journalctl -u "$svc" -n 20 --no-pager >&2 || true
    err "$svc — state: ${state}"
  fi
done

echo ""
ok "Деплой завершён. Коммит: $(git log -1 --pretty='%h %s (%ci)')"
