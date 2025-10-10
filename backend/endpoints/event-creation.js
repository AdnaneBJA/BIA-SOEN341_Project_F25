const express = require("express");
const router = express.Router();

module.exports = (client) => {
    router.get("/", async (req, res) => {
        res.send("Hello world from event creation");
    });

    return router;
};