import * as Tickets from '../services/ticket.service.js';
import { AppError } from '../utils/errors.js';
import crypto from 'crypto';
import { env } from '../config/env.js';
import QRCode from 'qrcode';

export async function purchase(req, res, next) {
    try {
    // Crear ticket
    const ticket = await Tickets.purchase(req.body, req.user.sub);

    // 🔑 Generar firma HMAC del ticketId
    const h = crypto.createHmac('sha256', env.qrSigningSecret);
    h.update(ticket._id.toString());
    const signature = h.digest('hex');

    // 📦 Crear el objeto que irá dentro del QR
    const qrData = JSON.stringify({ t: ticket._id, s: signature });

    // 🖼️ Generar el QR como imagen base64
    const qrUrl = await QRCode.toDataURL(qrData);

    // Guardar QR en el ticket
    ticket.qrUrl = qrUrl;
    const updatedTicket = await ticket.save(); // <- guardar y usar el actualizado

    // ✅ Enviar ticket actualizado
    res.status(201).json({ ticket: updatedTicket });
    } catch (e) {
    next(e);
    }
}
