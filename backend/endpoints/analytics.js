const express = require('express');
const router = express.Router();
const client = require("../server");

router.get('/summary', async (req, res) => {
  try {
    const totalEvents = await client.query(`SELECT COUNT(*) FROM "Events"`);
    const totalTickets = await client.query(`SELECT COUNT(*) FROM "Ticket"`);
    const totalParticipants = await client.query(`SELECT COUNT(DISTINCT "studentID") FROM "Booking"`); 

    res.json({
      totalEvents: parseInt(totalEvents.rows[0].count),
      totalTickets: parseInt(totalTickets.rows[0].count),
      totalParticipants: parseInt(totalParticipants.rows[0].count)
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error getting the analytics");
  }
});

router.get('/tickets/monthly', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT DATE_TRUNC('month', "purchaseTime") AS month, COUNT(*) AS tickets_sold
      FROM "Ticket"
      GROUP BY month
      ORDER BY month;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error getting the ticket trends");
  }
});

router.get('/participation/type', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT e."eventType" AS "eventType", COUNT(DISTINCT b."studentID") AS participants
      FROM "Booking" b
      JOIN "Events" e ON b."eventID" = e."eventID"
      GROUP BY e."eventType";
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error getting the participation by event type");
  }
});


module.exports = router;