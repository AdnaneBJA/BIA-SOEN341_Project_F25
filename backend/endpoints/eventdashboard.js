const express = require("express");
const router = express.Router();

module.exports = (client) => {

    router.get("/", async (req, res) => {
        try{
            const { organizerID, organizerUsername } = req.query;

            if (organizerID) {
                const sql = 'SELECT * FROM ' + 'public' + '."Events" WHERE "organizerID" = $1';
                const results = await client.query(sql, [Number(organizerID)]);
                return res.json(results.rows);
            }

            if (organizerUsername) {
                const sql = 'SELECT * FROM ' + 'public' + '."Events" WHERE "organizerUserName" = $1';
                const results = await client.query(sql, [organizerUsername]);
                return res.json(results.rows);
            }

            const allSql = 'SELECT * FROM ' + 'public' + '."Events"';
            const analyticsResults = await client.query(allSql);
            res.json(analyticsResults.rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Database error" });
        }
    });

    // Get all analytics from event_analytics table
    router.get("/analytics", async (req, res) => {
        try{
            const sql = 'SELECT * FROM ' + 'public' + '."event_analytics"';
            const analyticsResults = await client.query(sql);
            res.json(analyticsResults.rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Database error" });
        }
    });

    // Get analytics for a specific event by eventID
    router.get("/analytics/:eventID", async (req, res) => {
        const eventID = req.params.eventID;
        try{
            const sql = 'SELECT * FROM ' + 'public' + '."Events" WHERE "eventID" = $1';
            const analyticsResults = await client.query(sql, [eventID]);
            res.json(analyticsResults.rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Database error" });
        }
    });

    // Get tickets issued for a specific event
    router.get("/tickets-issued/:eventID", async (req, res) => {
        const eventID = req.params.eventID;
        try {
            const sql = 'SELECT t."eventID", e."eventName", COUNT(*) AS total_tickets' +
                        ' FROM ' + 'public' + '."Ticket" t' +
                        ' JOIN ' + 'public' + '."Events" e ON t."eventID" = e."eventID"' +
                        ' WHERE t."eventID" = $1' +
                        ' GROUP BY t."eventID", e."eventName"';
            const results = await client.query(sql, [eventID]);

            if (results.rows.length > 0) {
                res.json(results.rows[0]);
            } else {
                res.json({ eventID, total_tickets: 0 });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Database error" });
        }
    });

    return router;
};