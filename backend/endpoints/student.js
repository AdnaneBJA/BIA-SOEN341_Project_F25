const express = require("express");
const path = require('path');
const router = express.Router();

module.exports = (client) => {
    router.get("/", async (req, res) => {
        res.send("Student endpoint is working");
    });

    router.post("/", async (req, res) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res
                .status(400)
                .json({ error: "Username and password are required." });
        }

        try {
            const sql = `
        INSERT INTO public."Student" ("studentUserName", "studentPassword")
        VALUES ($1, $2)
        RETURNING *;
      `;
            const values = [username, password];
            const result = await client.query(sql, values);

            res.status(201).json({
                message: "Student created successfully!",
                data: result.rows[0],
            });
        } catch (error) {
            console.error("Database error:", error);
            res.status(500).json({ error: "Database error" });
        }
    });

    // Returns tickets for a student with event details and a QR image URL
    router.get('/tickets/:studentID', async (req, res) => {
        const { studentID } = req.params;
        if (!studentID) return res.status(400).json({ error: 'studentID is required' });
        try {
            const sql = `
                SELECT
                  t."ticketID",
                  t."eventID",
                  t."purchaseTime",
                  t."valid",
                  t."qrCode",
                  e."eventName",
                  e."location",
                  e."startTime" AS "eventDate"
                FROM public."Ticket" t
                JOIN public."Events" e ON e."eventID" = t."eventID"
                WHERE t."studentID" = $1
                ORDER BY t."purchaseTime" DESC
            `;
            const { rows } = await client.query(sql, [studentID]);

            // Map to include a URL to the QR image if stored
            const tickets = rows.map(r => {
                let qrCodeUrl = null;
                if (r.qrCode) {
                    const fileName = path.basename(r.qrCode);
                    qrCodeUrl = `/qrcodes/${fileName}`;
                }
                return { ...r, qrCodeUrl };
            });

            return res.json(tickets);
        } catch (err) {
            console.error('Error fetching student tickets:', err);
            return res.status(500).json({ error: 'Failed to fetch tickets' });
        }
    });
    router.post('/saved-events', async (req, res) => {
        const { studentID, eventID } = req.body;
        if (!studentID || !eventID) return res.status(400).json({ error: 'studentID and eventID are required' });
        try {
            const sql = `
                INSERT INTO public."SavedEvents" ("studentID", "eventID")
                VALUES ($1, $2)
                ON CONFLICT ("studentID", "eventID") DO NOTHING
                RETURNING *;
            `;
            const { rows } = await client.query(sql, [studentID, eventID]);
            return res.status(200).json({ saved: rows.length > 0 });
        } catch (err) {
            console.error('Error saving event:', err);
            return res.status(500).json({ error: 'Failed to save event' });
        }
    });

    router.delete('/saved-events', async (req, res) => {
        const { studentID, eventID } = req.body;
        if (!studentID || !eventID) return res.status(400).json({ error: 'studentID and eventID are required' });
        try {
            const sql = `
                DELETE FROM public."SavedEvents"
                WHERE "studentID" = $1 AND "eventID" = $2
            `;
            const result = await client.query(sql, [studentID, eventID]);
            return res.status(200).json({ removed: result.rowCount > 0 });
        } catch (err) {
            console.error('Error removing saved event:', err);
            return res.status(500).json({ error: 'Failed to remove saved event' });
        }
    });

    router.get('/saved-events/:studentID', async (req, res) => {
        const { studentID } = req.params;
        if (!studentID) return res.status(400).json({ error: 'studentID is required' });
        try {
            const sql = `
                SELECT e."eventID", e."eventName", e."startTime", e."endTime", e."location", e."eventType", e."eventPrices"
                FROM public."SavedEvents" s
                JOIN public."Events" e ON e."eventID" = s."eventID"
                WHERE s."studentID" = $1
                ORDER BY s."savedAt" DESC
            `;
            const { rows } = await client.query(sql, [studentID]);
            return res.json(rows);
        } catch (err) {
            console.error('Error fetching saved events:', err);
            return res.status(500).json({ error: 'Failed to fetch saved events' });
        }
    });

    return router;
};