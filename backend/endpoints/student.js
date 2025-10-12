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

    return router;
};