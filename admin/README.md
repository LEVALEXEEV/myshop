# MyShop Admin (separate service)

A small admin panel to manage `products` and `product_stock` in the existing Postgres database.

## Features

- Session login (httpOnly cookie)
- CSRF protection
- Rate limiting for login
- Product CRUD
- Stock editor per product
- Image upload into the shop `server/images/*` folder (writes paths like `/images/products/...` into DB)

## Local setup

1) Install deps

```bash
cd admin
npm i
```

2) Create `.env`

```bash
cp .env.example .env
```

3) Generate password hash

```bash
cd admin
npm run hash-password -- "your-strong-password"
```

Put the output into `ADMIN_PASSWORD_HASH` in `.env`.

4) Run

```bash
cd admin
npm run dev
```

Open http://localhost:8090

## Notes about images

- The admin uploads files into `SHOP_IMAGES_DIR/<folder>`.
- The shop expects public paths like `/images/products/...`.
- In local dev, `SHOP_IMAGES_DIR=../server/images` works because the shop server serves `/images` from `server/images`.

## Deploy to Debian (no Docker)

1) Copy folder `admin/` to the server, e.g. `/opt/myshop/admin`.
2) Install Node.js LTS on the server.
3) Install deps:

```bash
cd /opt/myshop/admin
npm ci
```

4) Create `/opt/myshop/admin/.env` (copy from `.env.example`) and set:

- `PG_LINK=postgresql://...`
- `ADMIN_PASSWORD_HASH=...`
- `SESSION_SECRET=...`
- `PUBLIC_URL=https://admin.your-domain.tld`
- `SESSION_COOKIE_SECURE=true`
- `SHOP_IMAGES_DIR=/opt/myshop/server/images` (or wherever your shop images live)

5) Create systemd unit

Copy `systemd/myshop-admin.service.example` to `/etc/systemd/system/myshop-admin.service` and adjust paths.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now myshop-admin
sudo systemctl status myshop-admin
```

6) Nginx reverse proxy

Copy `nginx/myshop-admin.conf.example` into your Nginx sites, set your domain, enable HTTPS, reload Nginx.

## Security checklist (recommended)

- Use HTTPS
- Set `SESSION_COOKIE_SECURE=true` in production
- Consider BasicAuth in Nginx as an extra gate
- Keep Postgres bound to localhost
- Keep `ADMIN_ALLOWED_IPS` empty unless you want IP allowlist
