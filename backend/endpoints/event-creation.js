const express = require("express");
const router = express.Router();

module.exports = (client) => {
    router.get("/", async (req, res) => {
        res.send("Hello world from event creation");
    });
    
    router.post("/", async (req, res) => {
        res.send("Event creation endpoint is working");
    });

    return router;
};