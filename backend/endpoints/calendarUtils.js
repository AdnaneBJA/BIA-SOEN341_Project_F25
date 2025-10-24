function generateICS(event) {
  const startDate = new Date(event.startTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endDate = new Date(event.endTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EventDashboard//CalendarExport//EN
BEGIN:VEVENT
UID:${event.eventID}@eventdashboard.com
DTSTAMP:${startDate}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.eventName}
DESCRIPTION:${event.description || 'Event from Dashboard'}
LOCATION:${event.location || 'TBD'}
END:VEVENT
END:VCALENDAR
  `.trim();
}

module.exports = { generateICS };