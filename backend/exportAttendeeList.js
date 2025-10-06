import express from 'express';
import { Pool } from 'pg';
import {Parser} from 'json2csv';


//handling the file export
//!!! change the database connection details !!!
// const app = express();
// const pool = new Pool({
//     user: 'your_db_user',
//     host: 'localhost',
//     database: 'your_db_name',
//     password: 'Bianca',
//     port: 5432,
// });

// app.get('/export-attendees', async (req, res) => {
//     // const eventId = req.params.eventId;
//     try {
//         const result = await pool.query('SELECT studentID, studentUserName, studentPassword FROM Student');
//         const attendees = result.rows;
//         const json2csvParser = new Parser({ fields: ['studentID','studentUserName', 'studentPassword'] });
//         const csv = json2csvParser.parse(attendees);

//         res.header('Content-Type', 'text/csv');
//         res.attachment(`attendees.csv`);
//         res.send(csv);
//     } catch (e) {
//         console.error(e);
//         res.status(500).send('Error generating CSV');
//     }
// });

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
