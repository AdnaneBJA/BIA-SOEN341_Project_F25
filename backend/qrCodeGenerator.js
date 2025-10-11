const QRCode = require('qrcode');
const { Client } = require('pg');

// async function generateQRCode(data) {
//     try {
//         const qrCodeDataURL = await QRCode.toDataURL(data);
//         return qrCodeDataURL;
//     } catch (err) {
//         console.error('Error generating QR code:', err);
//         throw err;
//     }
// }

async function generateQRCodes() {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL");

    const result = await client.query('SELECT ticketID FROM public."Ticket"');

    for (const row of result.rows) {
      const ticketID = row.ticketid; 
      const data = `ticketID:${ticketID}`;

      await QRCode.toFile(`./qrcodes/ticket_${ticketID}.png`, data);
      console.log(`Created QR for ticket ${ticketID}`);
    }

  } catch (err) {
    console.error('Error generating QR codes:', err);
  } finally {
    await client.end();
    console.log('Connection closed');
  }
}

generateQRCodes();

module.exports = { generateQRCode };


