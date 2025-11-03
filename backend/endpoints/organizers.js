const express = require("express");
const app = express.Router();

module.exports = (client) => {
    app.get("/", async (req, res) => {
        try {
            const query = `
                SELECT "organizerID", "organizerUserName", "approved"
                FROM public."Organizer"
                ORDER BY "organizerID" ASC
            `;

            const result = await client.query(query);
            res.status(200).json(result.rows);
        } catch (error) {
            console.error("Error fetching organizers:", error);
            res.status(500).json({ error: "Failed to fetch organizers" });
        }
    });

    app.post("/toggle-approval", async (req, res) => {
        const { organizerID, approved } = req.body;

        if (!organizerID || typeof approved !== 'boolean') {
            return res.status(400).json({
                error: "organizerID and approved (boolean) are required"
            });
        }

        try {
            const query = `
                UPDATE public."Organizer"
                SET "approved" = $1
                WHERE "organizerID" = $2
                RETURNING "organizerID", "organizerUserName", "approved"
            `;

            const values = [approved, organizerID];
            const result = await client.query(query, values);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: "Organizer not found"
                });
            }

            res.status(200).json({
                message: `Organizer approval status updated successfully`,
                organizer: result.rows[0]
            });
        } catch (error) {
            console.error("Error updating approval status:", error);
            res.status(500).json({
                error: "Failed to update approval status"
            });
        }
    });

    return app;
};

