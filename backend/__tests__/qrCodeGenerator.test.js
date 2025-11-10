const fs = require('fs');
const path = require('path');
const { generateQRCodes } = require('../qrCodeGenerator');

// Integration test using the real qrcode library
// Verifies that a PNG file is written and a data URL is returned.

describe('generateQRCodes (integration)', () => {
  const ticketId = 12345;
  const expectedDir = path.join(__dirname, '..', 'qrcodes');
  const expectedFile = path.join(expectedDir, `ticket_${ticketId}.png`);

  // Clean up any prior artifact before test
  beforeAll(() => {
    if (fs.existsSync(expectedFile)) {
      try { fs.unlinkSync(expectedFile); } catch (e) { /* ignore */ }
    }
  });

  test('creates QR code file and returns paths + dataUrl', async () => {
    const result = await generateQRCodes(ticketId);

    expect(result).toHaveProperty('qrPath');
    expect(result).toHaveProperty('relPath');
    expect(result).toHaveProperty('dataUrl');

    // Path checks
    expect(result.qrPath).toBe(expectedFile);
    expect(result.relPath).toBe(path.join('qrcodes', `ticket_${ticketId}.png`));

    // File actually created
    expect(fs.existsSync(result.qrPath)).toBe(true);

    // DataURL sanity
    expect(result.dataUrl.startsWith('data:image/png;base64,')).toBe(true);
  });
});
