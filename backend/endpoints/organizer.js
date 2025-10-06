const express = require("express");
const router = express.Router();

module.exports = (client) => {
    router.get("/", async (req, res) => {
        try {
            const sql = `SELECT * FROM public."Organizer";`;
            const result = await client.query(sql);

            res.status(200).json({
                message: "Retrieving all organizer accounts",
                data: result.rows,
            });
        } catch (error) {
            console.error("Database error:", error);
            res.status(500).json({ error: "Database error" });
        }
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
        INSERT INTO public."Organizer" ("organizerUserName", "organizerPassword")
        VALUES ($1, $2)
        RETURNING *;
      `;
            const values = [username, password];
            const result = await client.query(sql, values);

            res.status(201).json({
                message: "Organizer created successfully!",
                data: result.rows[0],
            });
        } catch (error) {
            console.error("Database error:", error);
            res.status(500).json({ error: "Database error" });
        }
    });

    return router;
};