async function addToCalendar(eventID, eventName) {
  try {
    const response = await fetch(`/calendar/${eventID}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventName}.ics`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading calendar file:', error);
  }
}