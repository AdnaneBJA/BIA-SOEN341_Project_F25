const express = require('express');
const router = express.Router();


const events =[];


router.post('/events', (req, res) => {
    const { title, date, location, description } = req.body;
    if (!title || !date || !location || !description) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    const newEvent = { id: events.length + 1, title, date, location, description };
    events.push(newEvent);
    res.status(201).json(newEvent);
});

module.exports = router;