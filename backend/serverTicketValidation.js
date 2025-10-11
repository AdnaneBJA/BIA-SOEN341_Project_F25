//server code for ticket validation
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const bodyParser = require('body-parser');
const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

//test for password
console.log('Database password:', process.env.DB_PASSWORD);

const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
});
client.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Connection error:', err.stack));

app.post('/validate-ticket', async (req, res) => {
    const { ticketID } = req.body;

    if (!ticketID) {
        return res.status(400).json({ error: 'Ticket ID is required' });
    }
    try{
        //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        //!!! Valid assumes there is a column named valid in Ticket table. if not, change to check if valid or not
        //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

        const result = await client.query('SELECT * FROM public."Ticket" WHERE "ticketID" = $1', [ticketID]);
        if (result.rows.length === 0) {
            return res.status(404).json({ valid: false, message: 'Ticket not found' });
        }

        const ticket = result.rows[0];
        if (ticket.valid){
            return res.status(200).json({ valid: true, message: 'Ticket is valid' });
        }
        else{
            return res.status(200).json({ valid: false, message: 'Ticket has already been used or is expired'});

        }
    } catch (e){
        console.error('Error validating ticket:', e);
        return res.status(500).json({ error: 'Server error' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Ticket validation service running on port ${PORT}`);
});


