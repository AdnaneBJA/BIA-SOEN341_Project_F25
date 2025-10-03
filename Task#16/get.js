const express = require('express');
const router = express.Router();

//fake data to see how it works
//!!! change this to the actual data!!!
const analyticsData = {
    '1': {attnedee: 120, ticketsSold: 200, revenue: 3000}, //'1' is the event ID
    '2': {attnedee: 80, ticketsSold: 150, revenue: 2000},
    '3': {attnedee: 200, ticketsSold: 250, revenue: 5000},
    
}

router.get('/:eventId', (req, res) => {
    const eventId = req.params.eventId; //extract the eventID from the URL
    const data = analyticsData[eventId]; //look up the data for the eventID given

    if (data) {
        res.json({eventId, analytics: data}); //if found, return the data as JSON (looks like python dictionaries)
    } else {
        res.status(404).json({error: 'Event not found'}); //if eventID not found, return 404
    }
});

module.exports = router;