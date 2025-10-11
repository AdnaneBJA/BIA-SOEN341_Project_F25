const express = require('express');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
});

function claimTickets(client){
    const router = express.Router();

    router.post('/claim-tickets', async (req, res) => {
        const { eventID, studentID, email } = req.body;

        if (!eventID || !studentID || !email) {
            return res.status(400).json({ error: 'Event ID, Student ID, and Email are required. One or more are missing' });
        }

        const eventResult = await client.query('SELECT "maxParticipants" FROM public."Event" WHERE "eventID" = $1', [eventID]);
        
        if (eventResult.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const maxTickets = eventResult.rows[0].maxParticipants;

        const ticketCountResult = await client.query('SELECT COUNT(*) FROM public."Ticket" WHERE "eventID" = $1', [eventID]);
        const soldTickets = parseInt(ticketCountResult.rows[0].count);

        if (soldTickets >= maxTickets) {
            return res.status(400).json({ error: 'Sorry, tickets are sold out' });
        }

        const insertResultToDB = await client.query(
            'INSERT INTO public."Ticket" ("eventID", "studentID", "purchaseTime", "valid") VALUES ($1, $2, NOW(), $3) RETURNING "ticketID"',
            [eventID, studentID, true]
        );

        const ticketID = insertResultToDB.rows[0].ticketID;
        const qrPath = await generateQRCodes(ticketID);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: `BIA Events <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your Event Ticket QR Code',
            text: `Thank you for claiming your ticket. Attached is your QR code for ticket ID: ${ticketID}`,
            attachments: [
                {
                    filename: `ticket_${ticketID}.png`,
                    path: qrPath,
                },
            ],
        });

        res.status(200).json({ message: 'Ticket claimed successfully. Check your email for the QR code.', ticketID });
    });

    return router;

}
