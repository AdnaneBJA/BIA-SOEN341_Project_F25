const express = require('express');
const nodemailer = require('nodemailer');
const { generateQRCodes } = require('../qrCodeGenerator');

module.exports = (client) => {
  const router = express.Router();

  // Claim ticket (transactional: checks capacity, prevents duplicates, increments currentParticipants)
  router.post('/claim-tickets', async (req, res) => {
    const { eventID, studentID, email } = req.body;

    if (!eventID || !studentID || !email) {
      return res.status(400).json({ error: 'Event ID, Student ID, and Email are required. One or more are missing' });
    }

    try {
      await client.query('BEGIN');

      // Lock the event row to avoid race conditions
      const eventResult = await client.query(
        'SELECT "maxParticipants", "currentParticipants" FROM public."Events" WHERE "eventID" = $1 FOR UPDATE',
        [eventID]
      );
      if (eventResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Event not found' });
      }
      const maxParticipants = eventResult.rows[0].maxParticipants;
      const currentParticipants = eventResult.rows[0].currentParticipants;

      // Prevent duplicate claims by the same student for the same event
      const existing = await client.query(
        'SELECT 1 FROM public."Ticket" WHERE "eventID" = $1 AND "studentID" = $2',
        [eventID, studentID]
      );
      if (existing.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'You have already claimed a ticket for this event.' });
      }

      // Capacity check using currentParticipants for accuracy under lock
      if (currentParticipants >= maxParticipants) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Sorry, tickets are sold out' });
      }

      // Create ticket with a temporary qrCode placeholder (will update after generating)
      const insertResultToDB = await client.query(
        'INSERT INTO public."Ticket" ("eventID", "studentID", "purchaseTime", "valid", "qrCode") VALUES ($1, $2, NOW(), $3, $4) RETURNING "ticketID"',
        [eventID, studentID, true, 'pending']
      );
      const ticketID = insertResultToDB.rows[0].ticketid || insertResultToDB.rows[0].ticketID;

      // Generate QR code (file on disk for email + data URL for frontend)
      const { qrPath, relPath, dataUrl } = await generateQRCodes(ticketID);

      // Update the row with the actual QR code relative path
      await client.query('UPDATE public."Ticket" SET "qrCode" = $1 WHERE "ticketID" = $2', [relPath || qrPath, ticketID]);

      // Increment the event's current participants
      await client.query(
        'UPDATE public."Events" SET "currentParticipants" = "currentParticipants" + 1 WHERE "eventID" = $1',
        [eventID]
      );

      await client.query('COMMIT');

      // Attempt to send email, but don't fail the whole request if email sending fails
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        await transporter.sendMail({
          from: `BIA Events <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Your Event Ticket QR Code',
          text: `Thank you for claiming your ticket. Attached is your QR code for ticket ID: ${ticketID}`,
          attachments: [{ filename: `ticket_${ticketID}.png`, path: qrPath }],
        });
      } catch (mailErr) {
        console.error('Failed to send ticket email:', mailErr);
        // Continue; user still gets QR in response
      }

      return res.status(200).json({ message: 'Ticket claimed successfully.', ticketID, qrCode: dataUrl });
    } catch (err) {
      // Handle unique constraint violation gracefully
      if (err && err.code === '23505') {
        await client.query('ROLLBACK').catch(() => {});
        return res.status(400).json({ error: 'You have already claimed a ticket for this event.' });
      }
      console.error('Error in /claim-tickets:', err);
      await client.query('ROLLBACK').catch(() => {});
      return res.status(500).json({ error: 'Server error processing ticket claim.' });
    }
  });

  // Validate ticket (moved from server.js)
  router.post('/validate-ticket', async (req, res) => {
    try {
      const { ticketID } = req.body;
      if (!ticketID) {
        return res.status(400).json({ error: 'Ticket ID is required' });
      }
      const result = await client.query('SELECT "valid" FROM public."Ticket" WHERE "ticketID" = $1', [ticketID]);
      if (result.rows.length === 0) {
        return res.status(404).json({ valid: false, message: 'Ticket does not exist' });
      }
      const { valid } = result.rows[0];
      return res.status(200).json({ valid, message: valid ? 'Ticket is valid' : 'Ticket has already been used or is expired' });
    } catch (e) {
      console.error('Error validating ticket:', e);
      return res.status(500).json({ error: 'Server error' });
    }
  });

  // Preview QR for a ticket ID (fixed to use QR generator)
  router.get('/ticket/:id/qr', async (req, res) => {
    const ticketID = req.params.id;
    try {
      const { dataUrl } = await generateQRCodes(ticketID);
      res.send(`<img src="${dataUrl}" alt="QR Code for ticket ${ticketID}" />`);
    } catch (err) {
      console.error('Error generating QR for preview:', err);
      res.status(500).send('Error generating QR code');
    }
  });

  return router;
};
