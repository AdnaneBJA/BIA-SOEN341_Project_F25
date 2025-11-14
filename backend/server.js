const { Parser } = require('@json2csv/plainjs');

require('dotenv').config();
var express = require("express");
var app = express();
var { Client } = require("pg");
var cors = require("cors");

const path = require('path');
const PORT = 3000;
const createTables = require('./tables.js');
const createOrganizerRoutes = require("./endpoints/organizer");
const createStudentRoutes = require("./endpoints/student");
const createEventRoutes = require("./endpoints/events");
const createLoginRoutes = require("./endpoints/login");
const createEventDashboardRoutes = require("./endpoints/eventdashboard")
const calendarRoutes = require("./endpoints/calendar");
const createTicketsRoutes = require('./endpoints/tickets');
const discountFeatureRoutes = require('./endpoints/discountFeature');
const createOrganizersManagementRoutes = require('./endpoints/organizers');


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
app.use(createTicketsRoutes(client));
app.use("/organizers", createOrganizersManagementRoutes(client));
app.use('/qrcodes', express.static(path.join(__dirname, 'qrcodes')));
app.use('/events', discountFeatureRoutes(client));

function toCsv(attendees) {
    const parser = new Parser({
        fields: ['studentID', 'studentUserName', 'ticketID'],
        eol: '\r\n'
    });
    const core = parser.parse(attendees);
    const withSep = `sep=,\r\n${core}`;
    return `\uFEFF${withSep}`;
}

function sanitizeForFilename(name) {
    if (!name) return '';
    return String(name).replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 60);
}

async function verifyEventOwnership(eventId, organizerID, organizerUsername) {
    if (!organizerID && !organizerUsername) return true; // nothing to verify
    try {
        const q = await client.query('SELECT "organizerID", "organizerUserName" FROM public."Events" WHERE "eventID" = $1', [eventId]);
        const row = q.rows[0];
        if (!row) return false;
        if (organizerID && Number(organizerID) !== Number(row.organizerid || row.organizerID)) return false;
        if (organizerUsername && String(organizerUsername) !== String(row.organizerusername || row.organizerUserName)) return false;
        return true;
    } catch (e) {
        console.error('Ownership check failed', e);
        return false;
    }
}

app.get('/events/:eventId/export-attendees', async (req, res) => {
    const { eventId } = req.params;
    const { organizerID, organizerUsername } = req.query;
    if (!eventId) return res.status(400).send('Missing eventId');
    try {
        const allowed = await verifyEventOwnership(eventId, organizerID, organizerUsername);
        if (!allowed) return res.status(403).send('Forbidden: Event does not belong to this organizer');

        const evt = await client.query('SELECT "eventName" FROM public."Events" WHERE "eventID" = $1', [eventId]);
        const eventName = evt.rows[0]?.eventName || `event_${eventId}`;

        const sql = `
            SELECT s."studentID", s."studentUserName", t."ticketID"
            FROM public."Ticket" t
            JOIN public."Student" s ON s."studentID" = t."studentID"
            WHERE t."eventID" = $1
            ORDER BY s."studentID" ASC
        `;

        // Include ticket ID instead of student password for attendee export
        const result = await client.query(sql, [eventId]);
        const csv = toCsv(result.rows);

        const safeName = sanitizeForFilename(eventName);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="attendees_${safeName}_${eventId}.csv"`);

        return res.send(csv);
    } catch (e) {
        console.error('Error exporting attendees for event', eventId, e);
        return res.status(500).send('Error generating the CSV');
    }
});

app.get('/export-attendees', async (req, res) => {
    try {
        const eventId = req.query.eventID;
        const { organizerID, organizerUsername } = req.query;
        if (eventId) {
            const allowed = await verifyEventOwnership(eventId, organizerID, organizerUsername);
            if (!allowed) return res.status(403).send('Forbidden: Event does not belong to this organizer');

            const evt = await client.query('SELECT "eventName" FROM public."Events" WHERE "eventID" = $1', [eventId]);
            const eventName = evt.rows[0]?.eventName || `event_${eventId}`;

            const sql = `
                SELECT s."studentID", s."studentUserName", t."ticketID"
                FROM public."Ticket" t
                JOIN public."Student" s ON s."studentID" = t."studentID"
                WHERE t."eventID" = $1
                ORDER BY s."studentID" ASC
            `;
            const result = await client.query(sql, [eventId]);
            const csv = toCsv(result.rows);
            const safeName = sanitizeForFilename(eventName);
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="attendees_${safeName}_${eventId}.csv"`);

            return res.send(csv);
        }

        // Fallback: export all students (legacy behavior)
        const result = await client.query(`
            SELECT "studentID", "studentUserName", NULL AS "ticketID"
             FROM public."Student"
        `);
        const csv = toCsv(result.rows);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="attendees_all_students.csv"');
        res.send(csv);
    } catch (e) {
        console.error(e);
        res.status(500).send('Error generating the CSV: ' + e);
    }
});

//for admin modifications of organizations
const organizationModificationRoutes = require('./endpoints/organizationModification');
app.use('/organizations', (req, res, next) => {
    req.db = client;
    next();
}, organizationModificationRoutes);

//for admin role modifications
const rolesModificationRoutes = require('./endpoints/rolesModification');
app.use('/roles', (req, res, next) => {
    req.db = client;  
    next();
}, rolesModificationRoutes);

//for analytics
const analyticsRouter = require('./endpoints/analytics');
app.use('/analytics', analyticsRouter);

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