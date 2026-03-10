/**
 * utils/sheets.js — выгрузка заказов в Google Sheets
 *
 * Настройка:
 *   1. Создай Service Account в Google Cloud Console
 *   2. Скачай JSON-ключ → положи в admin/credentials/google-sa.json  (в .gitignore)
 *   3. В .env добавь:
 *        GOOGLE_SA_KEY_PATH=./credentials/google-sa.json
 *        GOOGLE_SHEETS_ID=<id таблицы из URL>
 *   4. В Google Sheets → Доступ → добавь email сервис-аккаунта как Редактора
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const STATUS_LABELS_RU = {
    pending:   'Ожидает оплаты',
    paid:      'Оплачен',
    completed: 'Доставлен',
    cancelled: 'Отменён',
};

async function getAuth() {
    const keyPath = process.env.GOOGLE_SA_KEY_PATH;
    if (!keyPath) throw new Error('GOOGLE_SA_KEY_PATH не задан в .env');

    const resolved = path.resolve(__dirname, '..', keyPath);
    const raw = await fs.readFile(resolved, 'utf8');
    const key = JSON.parse(raw);

    const auth = new google.auth.GoogleAuth({
        credentials: key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return auth;
}

/**
 * Экспортирует заказы в Google Sheets.
 * @param {Array<{promo: string, orders: Array}>} groups — массив { promo, orders }
 * @returns {string} URL таблицы
 */
export async function exportOrdersToSheets(groups) {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    if (!spreadsheetId) throw new Error('GOOGLE_SHEETS_ID не задан в .env');

    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Получаем текущие листы
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = meta.data.sheets.map((s) => ({
        title: s.properties.title,
        sheetId: s.properties.sheetId,
    }));

    const requests = [];

    for (const { promo, orders: promoOrders } of groups) {
        const existing = existingSheets.find((s) => s.title === promo);

        if (existing) {
            // Очистить лист
            requests.push({
                updateCells: {
                    range: { sheetId: existing.sheetId },
                    fields: 'userEnteredValue',
                },
            });
        } else {
            // Добавить новый лист
            requests.push({
                addSheet: {
                    properties: { title: promo },
                },
            });
        }
    }

    if (requests.length) {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: { requests },
        });
    }

    // Повторно получаем листы (чтобы узнать sheetId новых)
    const metaAfter = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetsAfter = metaAfter.data.sheets.map((s) => ({
        title: s.properties.title,
        sheetId: s.properties.sheetId,
    }));

    // Записываем данные по каждой группе
    const HEADER = ['ID', 'Дата', 'Промокод', 'Сумма, ₽', 'Статус'];

    const dataRequests = [];

    for (const { promo, orders: promoOrders } of groups) {
        const sheet = sheetsAfter.find((s) => s.title === promo);
        if (!sheet) continue;

        const rows = [HEADER];

        for (const o of promoOrders) {
            const date = o.created_at
                ? new Date(o.created_at).toLocaleString('ru-RU', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                  })
                : '';

            rows.push([
                o.id,
                date,
                o.promo || '',
                o.total,
                STATUS_LABELS_RU[o.status] || o.status,
            ]);
        }

        // Строка с жирным заголовком
        dataRequests.push({
            updateCells: {
                range: {
                    sheetId: sheet.sheetId,
                    startRowIndex: 0,
                    startColumnIndex: 0,
                },
                rows: rows.map((row, rowIdx) => ({
                    values: row.map((cell) => ({
                        userEnteredValue:
                            typeof cell === 'number'
                                ? { numberValue: cell }
                                : { stringValue: String(cell ?? '') },
                        userEnteredFormat: rowIdx === 0 ? { textFormat: { bold: true } } : {},
                    })),
                })),
                fields: 'userEnteredValue,userEnteredFormat.textFormat.bold',
            },
        });

        // Авто-ширина колонок
        dataRequests.push({
            autoResizeDimensions: {
                dimensions: {
                    sheetId: sheet.sheetId,
                    dimension: 'COLUMNS',
                    startIndex: 0,
                    endIndex: HEADER.length,
                },
            },
        });
    }

    if (dataRequests.length) {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: { requests: dataRequests },
        });
    }

    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}
