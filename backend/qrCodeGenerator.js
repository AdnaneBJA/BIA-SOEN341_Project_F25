const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');


async function generateQRCodes(ticketID) {
  const qrData = String(ticketID);
  const relPath = path.join('qrcodes', `ticket_${ticketID}.png`);
  const absDir = path.join(__dirname, 'qrcodes');
  if (!fs.existsSync(absDir)) {
    fs.mkdirSync(absDir, { recursive: true });
  }
  const absPath = path.join(__dirname, relPath);

  await QRCode.toFile(absPath, qrData);
  const dataUrl = await QRCode.toDataURL(qrData);

  return { qrPath: absPath, relPath, dataUrl };
}

module.exports = { generateQRCodes };
