import * as Tickets from '../services/ticket.service.js';
import { AppError } from '../utils/errors.js';
import crypto from 'crypto';
import { env } from '../config/env.js';
import QRCode from 'qrcode';

export async function purchase(req, res, next) {
    try {
    const ticket = await Tickets.purchase(req.body, req.user.sub);

    // 🔑 Generar firma HMAC del ticketId
    const h = crypto.createHmac('sha256', env.qrSigningSecret);
    h.update(ticket._id.toString());
    const signature = h.digest('hex');

    // 📦 Crear el objeto que irá dentro del QR
    const qrData = JSON.stringify({ t: ticket._id, s: signature });

    // 🖼️ Generar el QR como imagen base64
    const qrUrl = await QRCode.toDataURL(qrData);

    // Guardar en el ticket
    ticket.qrUrl = qrUrl;
    await ticket.save();

    res.status(201).json({ ticket });
    } catch (e) {
    next(e);
    }
}

export async function scan(req, res, next) {
    try {
    const { token } = req.body;
    if (!token) throw new AppError('Missing token', 400, 'MISSING_TOKEN');

    let data;
    if (typeof token === 'string') {
        try { data = JSON.parse(token); }
        catch { throw new AppError('Invalid token', 400, 'INVALID_TOKEN'); }
    } else if (typeof token === 'object' && token !== null) {
      data = token; // permite enviar { t, s } directo
    } else {
        throw new AppError('Invalid token', 400, 'INVALID_TOKEN');
    }

    const { t, s } = data || {};
    if (!t || !s) throw new AppError('Invalid token', 400, 'INVALID_TOKEN');

    // 🔑 Verificar firma
    const h = crypto.createHmac('sha256', env.qrSigningSecret);
    h.update(t);
    const expected = h.digest('hex');
    if (s !== expected) throw new AppError('Invalid signature', 400, 'INVALID_SIGNATURE');

    const ticket = await Tickets.findTicketById(t);
    if (!ticket) throw new AppError('Ticket not found', 404, 'TICKET_NOT_FOUND');

    const updated = await Tickets.checkIn(ticket);
    res.json({ ok: true, ticket: updated });
    } catch (e) { next(e); }
}
