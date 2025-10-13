const express = require("express");
const router = express.Router();
const { generateICS } = require("./calendarUtils");
const client = require("../server");

router.get("/:eventID", async (req, res) => {
  const { eventID } = req.params;

  try {
    const result = await client.query('SELECT * FROM public."Events" WHERE "eventID" = $1', [eventID]);
    const event = result.rows[0];

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const icsContent = generateICS({
      eventID: event.eventID,
      eventName: event.eventName,
      startTime: event.startTime,
      endTime: event.endTime,
      description: event.eventDescription,
      location: event.location
    });

    res.setHeader("Content-Disposition", `attachment; filename=${event.eventName}.ics`);
    res.setHeader("Content-Type", "text/calendar");
    res.send(icsContent);

  } catch (error) {
    console.error("Error generating calendar file:", error);
    res.status(500).json({ message: "Failed to generate calendar file" });
  }
});

module.exports = router;