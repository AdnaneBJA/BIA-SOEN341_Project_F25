const express = require("express");
const router = express.Router();

module.exports = (client) => {
    router.get("/", async (req, res) => {
        try {
            const sql = `SELECT * FROM public."Events";`;
            const result = await client.query(sql);

            res.status(200).json({
                message: "Retrieving all events",
                data: result.rows,
            });
        } catch (error) {
            console.error("Database error:", error);
            res.status(500).json({ error: "Database error" });
        }
    });

    router.get("/organizations", async (req, res) => {
        try {
            const sql = `SELECT DISTINCT "Organization" FROM public."Events" WHERE "Organization" IS NOT NULL AND trim("Organization") <> '' ORDER BY "Organization" ASC;`;
            const result = await client.query(sql);
            const organizations = result.rows.map(r => r.Organization);
            res.status(200).json({
                message: "Retrieving all organizations",
                data: organizations,
            });
        } catch (error) {
            console.error("Database error:", error);
            res.status(500).json({ error: "Database error" });
        }
    });

    router.post("/", async (req, res) => {
        const {
            eventName,
            eventType,
            startTime,
            endTime,
            location,
            maxParticipants,
            eventPrices,
            eventDescription,
            organizerUserName,
            Organization
        } = req.body;

        if (
            !eventName ||
            !startTime ||
            !endTime ||
            maxParticipants === null ||
            eventPrices === null ||
            !Organization ||
            !organizerUserName ||
            !location
        ) {
            return res.status(400).json({
                error: "Required fields: eventName, startTime, endTime, location, maxParticipants, eventPrices, Organization Name, organizerUserName",
            });
        }

        try {
            //first get the organizerID by using organizerUserName
            const organizerLookupSql = `
                SELECT "organizerID" FROM public."Organizer" 
                WHERE "organizerUserName" = $1; 
            `;
            const organizerResult = await client.query(organizerLookupSql, [organizerUserName]);

            if (organizerResult.rows.length === 0) {
                return res.status(404).json({
                    error: "Organizer not found"
                });
            }

            const organizerID = organizerResult.rows[0].organizerID;
            // now insert event into table with organizerID and organizerUserName
            const sql = `
                INSERT INTO public."Events" (
                    "eventName",  
                    "organizerID", 
                    "eventType", 
                    "startTime", 
                    "endTime", 
                    "location", 
                    "maxParticipants", 
                    "eventPrices",
                    "eventDescription",
                    "organizerUserName", 
                    "Organization"
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *;
            `;

            const values = [
                eventName,
                organizerID,
                eventType,
                startTime,
                endTime,
                location,
                maxParticipants,
                eventPrices,
                eventDescription,
                organizerUserName,
                Organization
            ];

            const result = await client.query(sql, values);

            res.status(201).json({
                message: "Event created successfully!",
                data: result.rows[0],
            });
        } catch (error) {
            console.error("Database error:", error);
            res.status(500).json({ error: "Database error" });
        }
    });

    router.delete("/:eventID", async (req, res) => {
        const { eventID } = req.params;

        if (!eventID) {
            return res.status(400).json({
                error: "Event ID is required"
            });
        }

        try {
            const deleteTicketsSql = `
                DELETE FROM public."Ticket"
                WHERE "eventID" = $1;
            `;
            await client.query(deleteTicketsSql, [eventID]);

            const deleteEventSql = `
                DELETE FROM public."Events"
                WHERE "eventID" = $1
                RETURNING *;
            `;
            const result = await client.query(deleteEventSql, [eventID]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: "Event not found"
                });
            }

            res.status(200).json({
                message: "Event and associated tickets deleted successfully",
                data: result.rows[0]
            });
        } catch (error) {
            console.error("Database error:", error);
            res.status(500).json({ error: "Database error while deleting event" });
        }
    });

    return router;
};