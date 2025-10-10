//import express from 'express';
import pg from "pg"; // to link to PostgreSQL
import cors from "cors"; //security feature since frontend and backend are on different ports


const app = express();
const port = 3000; // backend port

app.use(cors());
app.use(express.json());

database.connect();

app.get("/analytics", async (req, res) => {
    try{
        const analyticsResults = await database.query("SELECT * FROM event_analytics"); 
    
        res.json(analyticsResults.rows); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }});

app.get("/events", async (req, res) => {
    try{
        const results = await database.query("SELECT * FROM Events"); 
        res.json(results.rows); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }});

app.get("/analytics/:eventID", async (req, res) => {
    const eventID = req.params.eventID;
    try{
        const analyticsResults = await database.query("SELECT * FROM Events WHERE eventID = $1", [eventID]); 
    
        res.json(analyticsResults.rows); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }});

app.get("/tickets-issued/:eventID", async (req, res) => {
    const eventID = req.params.eventID;
    try {
        const results = await database.query(`
            SELECT eventID, eventName, COUNT(*) AS total_tickets
            FROM tickets
            JOIN events ON tickets.eventID = events.eventID
            GROUP BY eventID, eventName
        `); 
            res.json(results.rows[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Database error" });
        }
    });

app.listen(port, () => {
    console.log("Server is running on port " + port);
});


    
