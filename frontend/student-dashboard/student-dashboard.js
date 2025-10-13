// Student Dashboard JavaScript
document.addEventListener("DOMContentLoaded", async function () {
    // Update user status in navbar
    updateUserStatus();

    // Setup disconnect button
    const disconnectBtn = document.getElementById('disconnect-btn');
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', () => {
            try {
                localStorage.clear();
            } catch (e) {
                console.error('Failed to clear localStorage', e);
            }
            updateUserStatus();
            // Redirect to login page
            window.location.href = '../login/login.html';
        });
    }

    // Load dashboard data
    await loadMyTickets();
    await loadSavedEvents();
    await loadUpcomingEvents();
});

// Update user status in navbar
function updateUserStatus(){
    const statusEl = document.getElementById('user-status');
    const disconnectBtn = document.getElementById('disconnect-btn');
    if (!statusEl) return;

    const role = localStorage.getItem('role');
    if (role) {
        const usernameKey = `${role.toLowerCase()}Username`;
        const username = localStorage.getItem(usernameKey) || 'Unknown';
        statusEl.innerHTML = `
            <span class="status-label">Currently logged in as:</span>
            <span class="status-username">${username}</span>
            <span class="role-badge">${role}</span>
        `;
        if (disconnectBtn) disconnectBtn.style.display = 'inline-flex';
    } else {
        statusEl.innerHTML = `<span class="status-label">Not logged in</span>`;
        if (disconnectBtn) disconnectBtn.style.display = 'none';
        // Redirect to login if not logged in
        window.location.href = '../login/login.html';
    }
}

// Track saved events for quick lookups
let savedEventIds = new Set();

// Load My Tickets
async function loadMyTickets() {
    const ticketsContainer = document.getElementById('my-tickets');
    const studentID = localStorage.getItem('studentID');

    if (!studentID) {
        ticketsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎟️</div>
                <p class="empty-state-text">Please log in to view your tickets</p>
            </div>
        `;
        return;
    }

    try {
        // Fetch tickets from backend
        const response = await fetch(`http://localhost:3000/student/tickets/${studentID}`);
        const tickets = await response.json();

        if (Array.isArray(tickets) && tickets.length > 0) {
            // Display only the first 3 tickets
            const recentTickets = tickets.slice(0, 3);
            ticketsContainer.innerHTML = recentTickets.map(ticket => {
                const eventDate = ticket.eventDate ? new Date(ticket.eventDate) : null;
                const dateText = eventDate ? eventDate.toLocaleDateString() : 'TBA';
                const timeText = eventDate ? eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                const qrSrc = ticket.qrCodeUrl ? `http://localhost:3000${ticket.qrCodeUrl}` : '';
                return `
                <div class="ticket-card">
                    <div class="ticket-card-header">
                        <h3>${ticket.eventName || 'Event'}</h3>
                        <span class="ticket-status ${ticket.valid ? 'active' : 'inactive'}">${ticket.valid ? 'Active' : 'Invalid'}</span>
                    </div>
                    <p><strong>Date:</strong> ${dateText} ${timeText}</p>
                    <p><strong>Location:</strong> ${ticket.location || 'TBA'}</p>
                    <p><strong>Ticket ID:</strong> #${ticket.ticketID}</p>
                    ${qrSrc ? `<div class="ticket-qr"><img src="${qrSrc}" alt="QR for ticket #${ticket.ticketID}"/></div>` : ''}
                </div>
                `;
            }).join('');
        } else {
            ticketsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🎟️</div>
                    <p class="empty-state-text">You haven't claimed any tickets yet</p>
                    <button class="empty-state-btn" onclick="location.href='../event-discovery/event-discovery.html'">Browse Events</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading tickets:', error);
        ticketsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p class="empty-state-text">Unable to load tickets. Please try again later.</p>
            </div>
        `;
    }
}

// Load Saved Events
async function loadSavedEvents() {
    const savedContainer = document.getElementById('saved-events');
    const studentID = localStorage.getItem('studentID');

    if (!studentID) {
        savedContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⭐</div>
                <p class="empty-state-text">Please log in to view saved events</p>
            </div>
        `;
        return;
    }

    try {
        // Fetch saved events from backend
        const response = await fetch(`http://localhost:3000/student/saved-events/${studentID}`);
        const savedEvents = await response.json();

        // Update local set for quick checks in other sections
        savedEventIds = new Set(savedEvents.map(e => String(e.eventID)));

        if (Array.isArray(savedEvents) && savedEvents.length > 0) {
            // Display only the first 3 saved events
            const recentSaved = savedEvents.slice(0, 3);
            savedContainer.innerHTML = recentSaved.map(event => {
                const start = event.startTime ? new Date(event.startTime) : null;
                const dateText = start ? start.toLocaleDateString() : 'TBA';
                const timeText = start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                const icsHref = `http://localhost:3000/calendar/${event.eventID}`;
                return `
                <div class="event-card" data-event-id="${event.eventID}">
                    <h3>${event.eventName}</h3>
                    <p><strong>Date:</strong> ${dateText} ${timeText}</p>
                    <p><strong>Location:</strong> ${event.location || 'TBA'}</p>
                    <div class="event-actions" style="display:flex;gap:8px;align-items:center;margin-top:8px;">
                        <a class="btn" href="${icsHref}" download>📅 Add to Calendar (.ics)</a>
                        <button class="btn btn-danger" onclick="removeSavedEvent(${event.eventID}, event)">Remove</button>
                    </div>
                </div>`;
            }).join('');
        } else {
            savedContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⭐</div>
                    <p class="empty-state-text">You haven't saved any events yet</p>
                    <button class="empty-state-btn" onclick="location.href='../event-discovery/event-discovery.html'">Browse Events</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading saved events:', error);
        savedContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p class="empty-state-text">Unable to load saved events. Please try again later.</p>
            </div>
        `;
    }
}

// Save an event for the student
async function saveEvent(eventID, ev) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    const studentID = localStorage.getItem('studentID');
    if (!studentID) {
        alert('Please log in to save events.');
        return;
    }
    try {
        const res = await fetch('http://localhost:3000/student/saved-events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentID, eventID })
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || 'Failed to save event');
        savedEventIds.add(String(eventID));
        await loadSavedEvents();
        const btn = document.querySelector(`button.save-btn[data-event-id='${eventID}']`);
        if (btn) {
            btn.outerHTML = `<button class="unsave-btn" data-event-id="${eventID}" onclick="removeSavedEvent(${eventID}, event)">Saved ✓ (Remove)</button>`;
        }
    } catch (e) {
        console.error('Save event error:', e);
        alert('Could not save event.');
    }
}

// Remove a saved event for the student
async function removeSavedEvent(eventID, ev) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    const studentID = localStorage.getItem('studentID');
    if (!studentID) {
        alert('Please log in.');
        return;
    }
    try {
        const res = await fetch('http://localhost:3000/student/saved-events', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentID, eventID })
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || 'Failed to remove saved event');
        savedEventIds.delete(String(eventID));
        await loadSavedEvents();
        const btn = document.querySelector(`button.unsave-btn[data-event-id='${eventID}']`) || document.querySelector(`button.save-btn[data-event-id='${eventID}']`);
        if (btn) {
            btn.outerHTML = `<button class="save-btn" data-event-id="${eventID}" onclick="saveEvent(${eventID}, event)">⭐ Save</button>`;
        }
    } catch (e) {
        console.error('Remove saved event error:', e);
        alert('Could not remove saved event.');
    }
}

// Load Upcoming Events
async function loadUpcomingEvents() {
    const upcomingContainer = document.getElementById('upcoming-events');

    try {
        // Fetch all events from backend
        const response = await fetch('http://localhost:3000/events');
        const payload = await response.json();
        const events = payload?.data || [];

        if (Array.isArray(events) && events.length > 0) {
            // Filter events that are in the future
            const now = new Date();
            const upcomingEvents = events
                .filter(event => event.startTime && new Date(event.startTime) > now)
                .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                .slice(0, 3); // Show only first 3

            if (upcomingEvents.length > 0) {
                upcomingContainer.innerHTML = upcomingEvents.map(event => {
                    const start = event.startTime ? new Date(event.startTime) : null;
                    const dateText = start ? start.toLocaleDateString() : 'TBA';
                    const timeText = start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                    const saved = savedEventIds.has(String(event.eventID));
                    const saveControl = saved
                        ? `<button class="unsave-btn" data-event-id="${event.eventID}" onclick="removeSavedEvent(${event.eventID}, event)">Saved ✓ (Remove)</button>`
                        : `<button class="save-btn" data-event-id="${event.eventID}" onclick="saveEvent(${event.eventID}, event)">⭐ Save</button>`;
                    return `
                    <div class="event-card" onclick="viewEvent(${event.eventID})">
                        <h3>${event.eventName}</h3>
                        <p><strong>Date:</strong> ${dateText}</p>
                        <p><strong>Time:</strong> ${timeText}</p>
                        <p><strong>Location:</strong> ${event.location}</p>
                        <p><strong>Price:</strong> ${event.eventPrices > 0 ? '$' + event.eventPrices : 'Free'}</p>
                        <span class="event-type">${event.eventType || ''}</span>
                        <div class="event-actions" style="margin-top:8px;">${saveControl}</div>
                    </div>
                    `;
                }).join('');
            } else {
                upcomingContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📅</div>
                        <p class="empty-state-text">No upcoming events at the moment</p>
                    </div>
                `;
            }
        } else {
            upcomingContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📅</div>
                    <p class="empty-state-text">No events available</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading upcoming events:', error);
        upcomingContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p class="empty-state-text">Unable to load upcoming events. Please try again later.</p>
            </div>
        `;
    }
}

// View individual event (redirect to event details page)
function viewEvent(eventID) {
    // Redirect to event details page with event ID
    window.location.href = `../event-discovery/event-discovery.html`;
}

// Filter by category
function filterByCategory(category) {
    // Redirect to events page with category filter
    window.location.href = `../event-discovery/event-discovery.html`;
}

// Expose actions for inline handlers
window.saveEvent = saveEvent;
window.removeSavedEvent = removeSavedEvent;
