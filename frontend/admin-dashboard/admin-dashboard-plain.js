// Plain script to fetch totals for admin dashboard (no imports or conflicts with react)
document.addEventListener('DOMContentLoaded', async () => {
  // Helper to set text safely
  function setText(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value;
  }

  // Fetch total events
  try {
    const resp = await fetch('http://localhost:3000/events/total');
    if (!resp.ok) throw new Error('Network response was not ok: ' + resp.status);
    const body = await resp.json();
    const count = Number(body.data ?? 0);
    setText('totalEventsValue', Number.isFinite(count) ? count.toLocaleString() : '—');
  } catch (err) {
    console.error('Failed to load total events', err);
    setText('totalEventsValue', '—');
  }

  // Fetch total tickets issued
  try {
    if (document.getElementById('totalTicketsValue')) {
      const resp = await fetch('http://localhost:3000/ticket/total');
      if (!resp.ok) throw new Error('Network response was not ok: ' + resp.status);
      const body = await resp.json();
      const count = Number(body.ticketCount ?? body.count ?? 0);
      setText('totalTicketsValue', Number.isFinite(count) ? count.toLocaleString() : '—');
    }
  } catch (err) {
    console.error('Failed to load total tickets', err);
    setText('totalTicketsValue', '—');
  }
});
