const express = require('express');
const router = express.Router();

//fake data to see how it works
//!!! change this to the actual data!!!
const analyticsData = {
    '1': {attnedee: 120, ticketsSold: 200, revenue: 3000}, //'1' is the event ID
    '2': {attnedee: 80, ticketsSold: 150, revenue: 2000},
    '3': {attnedee: 200, ticketsSold: 250, revenue: 5000},
    
};

// In-memory events store for the demo POST endpoint
const events = [];

router.get('/:eventId', (req, res) => {
    const eventID = req.params.eventId; //extract the eventID from the URL
    const data = analyticsData[eventID]; //look up the data for the eventID given

    if (data) {
        res.json({eventID, analytics: data}); //if found, return the data as JSON (looks like python dictionaries)
    } else {
        res.status(404).json({error: 'Event not found'}); //if eventID not found, return 404
    }
});

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