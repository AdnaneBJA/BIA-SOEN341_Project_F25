const { generateICS } = require('../endpoints/calendarUtils');

describe('calendarUtils.generateICS', () => {
  test('embeds event fields into ICS output', () => {
    const evt = {
      eventID: 5,
      eventName: 'My Event',
      startTime: '2025-01-01T10:00:00Z',
      endTime: '2025-01-01T11:00:00Z',
      description: 'Hello',
      location: 'Hall'
    };
    const ics = generateICS(evt);
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('UID:5@eventdashboard.com');
    expect(ics).toContain('SUMMARY:My Event');
    expect(ics).toContain('DESCRIPTION:Hello');
    expect(ics).toContain('LOCATION:Hall');
  });
});

