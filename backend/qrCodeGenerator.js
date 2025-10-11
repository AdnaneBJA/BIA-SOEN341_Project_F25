const QRCode = require('qrcode');
const { Client } = require('pg');
require('dotenv').config();


const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
});

// async function generateQRCodes() {
//   try {
//     await client.connect();
//     console.log("Connected to PostgreSQL");

//     const result = await client.query('SELECT "ticketID" FROM public."Ticket"');

//     for (const row of result.rows) {
//       const ticketID = row.ticketid; 
//       const data = `ticketID:${ticketID}`;

//       await QRCode.toFile(`./qrcodes/ticket_${ticketID}.png`, data);
//       console.log(`Created QR for ticket ${ticketID}`);
//     }

//   } catch (err) {
//     console.error('Error generating QR codes:', err);
//   } finally {
//     await client.end();
//     console.log('Connection closed');
//   }
// }

// generateQRCodes();

async function generateQRCodes(ticketID) {
  try {

    const qrData = `ticketID:${ticketID}`;
    const qrPath = `./qrcodes/ticket_${ticketID}.png`;


    console.log(`Created QR for ticket ${ticketID} at ${qrPath}`);

    return qrPath;

  } catch (err) {
    console.error('Error generating QR codes:', err);
  } finally {
    await client.end();
    console.log('Connection closed');
  }
}

// generateQRCodes();

module.exports = { generateQRCodes };


