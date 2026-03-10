import express from 'express';
import csrf from 'csurf';

import pool from '../db.js';
import { requireAuth, asyncHandler } from '../middleware/auth.js';
import { exportOrdersToSheets } from '../utils/sheets.js';

const router = express.Router();
const csrfProtection = csrf();

const STATUS_LABELS = {
    pending: 'Ожидает оплаты',
    paid: 'Оплачен',
    completed: 'Доставлен',
    cancelled: 'Отменён',
};

const STATUSES = Object.keys(STATUS_LABELS);

router.get('/', requireAuth, csrfProtection, asyncHandler(async (req, res) => {
    const statusFilter = STATUSES.includes(req.query.status) ? req.query.status : null;
    const promoFilter = (req.query.promo || '').trim();

    const conditions = [];
    const params = [];

    if (statusFilter) {
        params.push(statusFilter);
        conditions.push(`status = $${params.length}`);
    }

    if (promoFilter) {
        params.push(promoFilter);
        conditions.push(`promo = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows: orders } = await pool.query(
        `SELECT id, full_name, email, phone, shipping_method, promo, total, status, created_at, address, telegram
         FROM orders
         ${where}
         ORDER BY created_at DESC`,
        params,
    );

    // Summary computed from fetched rows
    const summary = { total: orders.length, totalSum: 0, byStatus: {} };
    for (const o of orders) {
        const t = Number(o.total);
        summary.totalSum += t;
        if (!summary.byStatus[o.status]) summary.byStatus[o.status] = { count: 0, sum: 0 };
        summary.byStatus[o.status].count++;
        summary.byStatus[o.status].sum += t;
    }

    // Distinct promos used in orders for filter dropdown
    const { rows: promoRows } = await pool.query(
        `SELECT DISTINCT promo FROM orders WHERE promo IS NOT NULL AND promo <> '' ORDER BY promo`,
    );
    const promos = promoRows.map((r) => r.promo);

    res.render('orders', {
        csrfToken: req.csrfToken(),
        orders,
        statusFilter,
        promoFilter,
        statusLabels: STATUS_LABELS,
        statuses: STATUSES,
        promos,
        summary,
        query: req.query,
    });
}));

router.get('/:id', requireAuth, csrfProtection, asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    const order = rows[0];
    if (!order) return res.status(404).send('Not found');

    // Enrich items with product title and price
    const rawItems = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
    let enrichedItems = rawItems;
    if (rawItems.length) {
        const ids = [...new Set(rawItems.map((i) => i.id).filter(Boolean))];
        if (ids.length) {
            const { rows: products } = await pool.query(
                'SELECT id, title FROM products WHERE id = ANY($1)',
                [ids],
            );
            const productMap = Object.fromEntries(products.map((p) => [p.id, p]));
            enrichedItems = rawItems.map((item) => ({
                ...item,
                title: productMap[item.id]?.title ?? `Товар #${item.id}`,
                qty: item.quantity ?? item.qty ?? 1,
                size: item.selectedSize ?? item.size ?? '—',
            }));
        }
    }

    res.render('order_detail', {
        csrfToken: req.csrfToken(),
        order,
        items: enrichedItems,
        statusLabels: STATUS_LABELS,
        statuses: STATUSES,
    });
}));

router.post('/:id/status', requireAuth, csrfProtection, asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const newStatus = req.body.status;

    if (!STATUSES.includes(newStatus)) {
        return res.status(400).send('Invalid status');
    }

    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [newStatus, id]);

    const back = req.headers.referer || '/orders';
    res.redirect(back);
}));

router.post('/export-to-sheets', requireAuth, csrfProtection, asyncHandler(async (req, res) => {
    // Берём только промокоды с флагом export_to_sheets = true
    const { rows: promoCodes } = await pool.query(
        `SELECT code FROM promo_codes WHERE export_to_sheets = TRUE ORDER BY code`,
    );

    if (!promoCodes.length) {
        return res.redirect('/orders?exportError=no_promos');
    }

    const codes = promoCodes.map((p) => p.code);

    const { rows: orders } = await pool.query(
        `SELECT id, promo, total, status, created_at
           FROM orders
          WHERE promo = ANY($1)
          ORDER BY promo, created_at DESC`,
        [codes],
    );

    // Группируем по промокоду
    const groupMap = new Map();
    for (const code of codes) groupMap.set(code, []);
    for (const o of orders) groupMap.get(o.promo)?.push(o);

    const groups = [...groupMap.entries()].map(([promo, ordersList]) => ({
        promo,
        orders: ordersList,
    }));

    const url = await exportOrdersToSheets(groups).catch((err) => {
        console.error('[sheets] export error:', err);
        return null;
    });

    if (!url) return res.redirect('/orders?exportError=fail');

    res.redirect(`/orders?exportUrl=${encodeURIComponent(url)}`);
}));

export default router;
