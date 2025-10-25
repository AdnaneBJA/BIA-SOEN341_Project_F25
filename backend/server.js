const { Parser } = require('@json2csv/plainjs');

require('dotenv').config();
var express = require("express");
var app = express();
var { Client } = require("pg");
var cors = require("cors");
const PORT = 3000;
const createTables = require('./tables.js');
const createOrganizerRoutes = require("./endpoints/organizer");
const createStudentRoutes = require("./endpoints/student");
const createEventRoutes = require("./endpoints/events");
const createLoginRoutes = require("./endpoints/login");
const createEventDashboardRoutes = require("./endpoints/eventdashboard")
const calendarRoutes = require("./endpoints/calendar");

//app.use('/', claimTickets());
app.use(express.json());
app.use(
    cors({
        origin: (origin, callback) => callback(null, true),
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true,
        allowedHeaders: "Content-Type,Authorization",
    })
);


const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
});

//i added this for now
module.exports = client;

client.connect(err => {
    if (err) {
        console.log("Error when connecting to database: ", err);
    }
    console.log("Succesfully connected to PostgreSQL database");
    createTables(client);
})

app.use("/organizer", createOrganizerRoutes(client));
app.use("/student", createStudentRoutes(client));
app.use("/events", createEventRoutes(client));
app.use("/login", createLoginRoutes(client));
app.use("/eventdashboard", createEventDashboardRoutes(client));
app.use("/calendar", calendarRoutes);

app.get('/export-attendees', async (req, res) => {
    try {
        const result = await client.query(`
            SELECT "studentID", "studentUserName", "studentPassword"
             FROM public."Student"
        `);

        const attendees = result.rows;

        const json2csvParser = new Parser({
           fields: ['studentID', 'studentUserName', 'studentPassword']
        });

        const csv = json2csvParser.parse(attendees);


        res.header('Content-Type', 'text/csv');
        res.attachment(`attendees.csv`);
        res.send(csv);
    } catch (e) {
        console.error(e);
        res.status(500).send('Error generating the CSV: ' + e);
    }
});

app.get('/ticket/:id/qr', async (req, res) => {
    const ticketID = req.params.id;
    const qrData = `https://your-server.com/validate-ticket?ticketID=${ticketID}`;

    try {
        const qrCode = await generateQRCode(qrData);
        res.send(`<img src="${qrCode}" alt="QR Code for ticket ${ticketID}" />`);
    } catch (err) {
        res.status(500).send('Error generating QR code');
    }
});

// app.post('/events', async (req, res) => {
//     try{
//         const{ eventID, eventName, organizerID, eventType, startTime, endTime, location, maxParticipants, currentParticipants, eventPrices, eventDescription, organizerUserName, Organization} = req.body;
//         const insertQuery = `
//             INSERT INTO public."Events" 
//             ("eventID", "eventName", "organizerID", "eventType", "startTime", "endTime", "location", "maxParticipants", "currentParticipants", "eventPrices", "eventDescription", "organizerUserName", "Organization") 
//             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *;
//         `;
//         const values = [eventID, eventName, organizerID, eventType, startTime, endTime, location, maxParticipants, currentParticipants, eventPrices, eventDescription, organizerUserName, Organization];

//         const result = await client.query(insertQuery, values);
//         res.status(201).json(result.rows[0]);
//     }catch (err) {
//         console.error('Error creating event:', err);
//         res.status(500).json({ error: 'Server error' });
//     }
// });

app.listen(PORT, (err) => {
    if (err) {
        console.log("Error in server setup: ", err);
    }
    console.log("Successfully connected to port: ", PORT);
})