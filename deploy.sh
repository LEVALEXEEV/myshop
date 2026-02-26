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

# ── 1. Git ────────────────────────────────────────────────────
log "Получаем изменения из origin/$BRANCH..."

# Сохраняем images — git reset --hard удалит их если они были в старом коммите
IMAGES_DIR="$APP_DIR/server/images"
IMAGES_TMP="$(mktemp -d)"
if [[ -d "$IMAGES_DIR" ]]; then
  cp -a "$IMAGES_DIR/." "$IMAGES_TMP/"
  log "Изображения сохранены во временную папку"
fi

git fetch origin
git reset --hard "origin/$BRANCH"
ok "Код обновлён: $(git log -1 --pretty='%h %s')"

# Восстанавливаем images поверх .gitkeep
if [[ -d "$IMAGES_TMP" ]]; then
  cp -a "$IMAGES_TMP/." "$IMAGES_DIR/"
  rm -rf "$IMAGES_TMP"
  log "Изображения восстановлены"
fi

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

# ── 4. Миграции БД ───────────────────────────────────────────
log "Применяем миграции..."
"$APP_DIR/db/migrate.sh"

# ── 5. Перезапуск сервисов ────────────────────────────────────
log "Перезапускаем myshop-server..."
sudo systemctl restart myshop-server
log "Перезапускаем myshop-admin..."
sudo systemctl restart myshop-admin

# ── 6. Перезагружаем nginx (подхватывает новый dist) ─────────
log "Перезагружаем nginx..."
sudo systemctl reload nginx

# ── 7. Проверка состояния ─────────────────────────────────────
sleep 2
log "Проверяем сервисы..."

for svc in myshop-server myshop-admin; do
  if systemctl is-active --quiet "$svc"; then
    ok "$svc — running"
  else
    err "$svc — FAILED. Лог: journalctl -u $svc -n 30 --no-pager"
  fi
done

echo ""
ok "Деплой завершён. Коммит: $(git log -1 --pretty='%h %s (%ci)')"
