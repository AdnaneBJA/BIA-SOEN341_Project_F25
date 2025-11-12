const express = require('express');
const nodemailer = require('nodemailer');
const { generateQRCodes } = require('../qrCodeGenerator');
const crypto = require('crypto');

module.exports = (client) => {
  const router = express.Router();

  // Claim ticket (transactional: checks capacity, prevents duplicates, increments currentParticipants)
  router.post('/claim-tickets', async (req, res) => {
    const { eventID, studentID, email, mockPaid } = req.body;

    if (!eventID || !studentID) {
      return res.status(400).json({ error: 'Event ID, Student ID are required. One or more are missing' });
    }

    try {
      await client.query('BEGIN');

      // Lock the event row to avoid race conditions and get price
      const eventResult = await client.query(
        'SELECT "eventName", "eventPrices", "maxParticipants", "currentParticipants", "startTime", "lastMinuteDiscountEnabled", "discountPercentage", "discountTimeWindowHours" FROM public."Events" WHERE "eventID" = $1 FOR UPDATE',
        [eventID]
      );
      if (eventResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Event not found' });
      }
      const { eventprices, maxparticipants, currentparticipants, eventname, starttime, lastminutediscountenabled, discountpercentage, discounttimewindowhours } = eventResult.rows[0];
      let price = eventprices || 0;
      const maxParticipants = maxparticipants;
      const currentParticipants = currentparticipants;
      const startTime = starttime;
      const discountEnabled = lastminutediscountenabled === true; // Must be explicitly true

      // Apply last-minute discount if enabled
      if (discountEnabled && price > 0) {
        const now = new Date();
        const eventStart = new Date(startTime);
        const hoursUntilStart = (eventStart - now) / (1000 * 60 * 60);
        
        // Use custom discount settings from database
        const customDiscountPercent = discountpercentage || 25;
        const customTimeWindowHours = discounttimewindowhours || 48;
        
        let discountPercent = 0;
        // Check if within the custom time window (in hours)
        if (hoursUntilStart > 0 && hoursUntilStart <= customTimeWindowHours) {
          discountPercent = customDiscountPercent;
        }
        
        if (discountPercent > 0) {
          price = Math.round(price * (100 - discountPercent) / 100 * 100) / 100;
        }
      }

      const isPaid = Number(price) > 0;
      if (isPaid && !mockPaid) {
        await client.query('ROLLBACK');
        return res.status(402).json({ error: 'Payment required', price });
      }

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

      const paymentStatus = isPaid ? 'mock_paid' : 'free';
      const purchaseAmount = isPaid ? Number(price) : 0;
      const transactionId = isPaid ? (crypto.randomUUID ? crypto.randomUUID() : 'tx_' + Math.random().toString(36).slice(2)) : null;

      // Create ticket with a temporary qrCode placeholder (will update after generating)
      const insertQuery = `
        INSERT INTO public."Ticket" ("eventID", "studentID", "purchaseTime", "valid", "qrCode", "purchaseAmount", "paymentStatus", "transactionId")
        VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7)
        RETURNING "ticketID"`;
      const insertResultToDB = await client.query(insertQuery, [eventID, studentID, true, 'pending', purchaseAmount, paymentStatus, transactionId]);
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
        if (email) {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
          });

          const lines = [
            `Thank you for ${isPaid ? 'purchasing' : 'claiming'} your ticket for ${eventname || 'the event'}.`,
            isPaid ? `Amount: $${purchaseAmount} (Mock Payment)` : 'This ticket is free.',
            `Attached is your QR code for ticket ID: ${ticketID}`
          ];

          await transporter.sendMail({
            from: `BIA Events <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Your ${isPaid ? 'Purchase' : 'Ticket'} QR Code`,
            text: lines.join('\n'),
            attachments: [{ filename: `ticket_${ticketID}.png`, path: qrPath }],
          });
        }
      } catch (mailErr) {
        console.error('Failed to send ticket email:', mailErr);
        // Continue; user still gets QR in response
      }

      return res.status(200).json({
        message: isPaid ? 'Ticket purchased successfully.' : 'Ticket claimed successfully.',
        ticketID,
        price: purchaseAmount,
        paymentStatus,
        transactionId,
        qrCode: dataUrl
      });
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
      const result = await client.query('SELECT "valid", "eventID" FROM public."Ticket" WHERE "ticketID" = $1', [ticketID]);
      if (result.rows.length === 0) {
        return res.status(404).json({ valid: false, message: 'Ticket does not exist' });
      }
      const { valid, eventid, eventID } = result.rows[0];
      const eid = eventID ?? eventid;
      return res.status(200).json({ valid, eventID: eid, message: valid ? 'Ticket is valid' : 'Ticket has already been used or is expired' });
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

  //fetch the total number of tickets
  router.get('/ticket/total', async (req, res) => {
      //In future, add admin validation
      // const adminID = req.params.id;
      // if (!adminID) {
      //   return res.status(400).json({ error: 'Admin ID is required' });
      // }
      try {
          const result = await client.query('SELECT COUNT(*) AS count FROM public."Ticket";');
          return res.status(200).json({
            message: "Retrieving total number of tickets",
            ticketCount : Number(result.rows[0].count)
          });

      } catch (error){
        console.error("Database error:", error);
        res.status(500).json({ error: "Database error" });
      }
  });

  return router;
};
