const express = require("express");

module.exports = (client) => {
    const router = express.Router();

    router.get("/", async (req, res) => {
        try{
            const { organizerID, organizerUsername } = req.query;            
            
              // New: participation trends (by date, by category, over time)
              router.get('/analytics/trends', async (req, res) => {
                try {
                  // Parse query params, default last 90 days
                  const { start, end, granularity = 'day' } = req.query;
                  const endDate = end ? new Date(end) : new Date();
                  const startDate = start ? new Date(start) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            
                  if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
                    return res.status(400).json({ error: 'Invalid start/end dates' });
                  }
            
                  // Validate granularity
                  const allowed = new Set(['day', 'week', 'month']);
                  const g = allowed.has(granularity) ? granularity : 'day';
            
                  // 1) Participation by event date (group by event start date)
                  const byDateSql = `
                    SELECT DATE(e."startTime") AS date, COUNT(t."ticketID") AS tickets
                    FROM public."Ticket" t
                    JOIN public."Events" e ON e."eventID" = t."eventID"
                    WHERE t."purchaseTime" >= $1 AND t."purchaseTime" <= $2
                    GROUP BY DATE(e."startTime")
                    ORDER BY DATE(e."startTime") ASC
                  `;
                  const byDate = (await client.query(byDateSql, [startDate.toISOString(), endDate.toISOString()])).rows;
            
                  // 2) Participation by category (eventType)
                  const byCategorySql = `
                    SELECT COALESCE(e."eventType",'Unknown') AS category, COUNT(t."ticketID") AS tickets
                    FROM public."Ticket" t
                    JOIN public."Events" e ON e."eventID" = t."eventID"
                    WHERE t."purchaseTime" >= $1 AND t."purchaseTime" <= $2
                    GROUP BY COALESCE(e."eventType",'Unknown')
                    ORDER BY tickets DESC
                  `;
                  const byCategory = (await client.query(byCategorySql, [startDate.toISOString(), endDate.toISOString()])).rows;
            
                  // 3) Over time (aggregate by granularity)
                  // date_trunc requires a constant, safe because we validated granularity
                  const trunc = g === 'week' ? 'week' : (g === 'month' ? 'month' : 'day');
                  const overTimeSql = `
                    SELECT to_char(date_trunc('${trunc}', t."purchaseTime"), 'YYYY-MM-DD') AS period,
                           COUNT(t."ticketID") AS tickets
                    FROM public."Ticket" t
                    WHERE t."purchaseTime" >= $1 AND t."purchaseTime" <= $2
                    GROUP BY date_trunc('${trunc}', t."purchaseTime")
                    ORDER BY date_trunc('${trunc}', t."purchaseTime") ASC
                  `;
                  const overTime = (await client.query(overTimeSql, [startDate.toISOString(), endDate.toISOString()])).rows;
            
                  return res.json({
                    range: { start: startDate.toISOString(), end: endDate.toISOString() },
                    byDate,
                    byCategory,
                    overTime,
                    granularity: g
                  });
                } catch (error) {
                  console.error('Error fetching participation trends:', error);
                  return res.status(500).json({ error: 'Database error' });
                }
              });
            

            if (organizerID) {
                const sql = 'SELECT * FROM public."Events" WHERE "organizerID" = $1';
                const results = await client.query(sql, [Number(organizerID)]);
                return res.json(results.rows);
            }

            if (organizerUsername) {
                const sql = 'SELECT * FROM public."Events" WHERE "organizerUserName" = $1';
                const results = await client.query(sql, [organizerUsername]);
                return res.json(results.rows);
            }

            return res.status(403).json({ error: 'Organizer identity required' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Database error" });
        }
    });

    router.get("/analytics", async (req, res) => {
        try{
            const sql = 'SELECT * FROM public."event_analytics"';
            const analyticsResults = await client.query(sql);
            res.json(analyticsResults.rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Database error" });
        }
    });

    router.get("/analytics/:eventID", async (req, res) => {
        const eventID = req.params.eventID;
        try{
            const sql = 'SELECT * FROM public."Events" WHERE "eventID" = $1';
            const analyticsResults = await client.query(sql, [eventID]);
            res.json(analyticsResults.rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Database error" });
        }
    });

    router.get("/tickets-issued/:eventID", async (req, res) => {
        const eventID = req.params.eventID;
        try {
            const sql = 'SELECT t."eventID", e."eventName", COUNT(*) AS total_tickets' +
                        ' FROM public."Ticket" t' +
                        ' JOIN public."Events" e ON t."eventID" = e."eventID"' +
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