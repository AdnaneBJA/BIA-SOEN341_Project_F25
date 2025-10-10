const express = require("express");
const router = express.Router();

module.exports = (client) => {

    router.get("/", async (req, res) => {
    try{
        const analyticsResults = await client.query(`SELECT * FROM public."Events"`); 
        res.json(analyticsResults.rows); //this part sends information back to frontend
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }});

    return router;
};