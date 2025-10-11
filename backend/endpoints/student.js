const express = require("express");
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

    return router;
};