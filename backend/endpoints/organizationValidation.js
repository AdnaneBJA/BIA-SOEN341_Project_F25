const express = require('express');
const router = express.Router();

router.post("/", async (req, res) => {
    const { username, password } = req.body;

    if (!username || username.trim() === ""){
        return res.status(400).json({ message: "Username is required" });
    }
    if (!password || password.trim() === ""){
        return res.status(400).json({ message: "Password is required" });
    }

    try{
        const duplicateCheck = await req.db.query(
            `SELECT * FROM "Organizer" WHERE LOWER("organizerUserName") = LOWER($1)`,
            [username.trim()]
        );

        if (duplicateCheck.rows.length > 0){
            return res.status(409).json({ message: "An organizer with this username already exists" });
        }

        const result = await req.db.query(
            `INSERT INTO "Organizer" ("organizerUserName", "organizerPassword") VALUES ($1, $2) RETURNING *`,
            [username.trim(), password.trim()]
    );

        res.status(201).json({
            message: "Organizer account created successfully.",
            organizer: result.rows[0],
            });
    } catch (err) {
        console.error("Error creating organizer:", err);
        res.status(500).json({ message: "Internal server error." });
    }

    }
    );
module.exports = router;