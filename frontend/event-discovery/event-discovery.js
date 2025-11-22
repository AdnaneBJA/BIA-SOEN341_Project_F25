const events = [
    { name: "Hackathon 2025", category: "Tech", organization: "CS Society", date: "2025-10-15", location: "EV Building" },
    { name: "Open Mic Night", category: "Arts", organization: "Student Union", date: "2025-10-18", location: "Hall Building" },
    { name: "Career Fair", category: "Tech", organization: "Student Union", date: "2025-10-20", location: "MB Building" },
    { name: "Volleyball Tournament", category: "Sports", organization: "Athletics", date: "2025-10-22", location: "Gymnasium" },
];

// Global variable to store events from database
let allEvents = [];
// Track which events the current student has already claimed
let claimedEventIds = new Set();
// Track which events the current student has saved (for save/unsave button logic)
let savedEventIds = new Set();

// Fetch events from database on page load
document.addEventListener("DOMContentLoaded", async () => {
    await prefetchClaimedTickets();
    await loadSavedEventIds();
    await fetchOrganizations();
    await fetchEventsFromDatabase();
});

async function prefetchClaimedTickets() {
    const studentID = localStorage.getItem('studentID') || localStorage.getItem('StudentID');
    if (!studentID) return;
    try {
        const res = await fetch(`http://localhost:3000/student/tickets/${studentID}`);
        const tickets = await res.json();
        if (Array.isArray(tickets)) {
            claimedEventIds = new Set(tickets.map(t => String(t.eventID)));
        }
    } catch (err) {
        console.error('Error prefetching claimed tickets:', err);
    }
}

async function loadSavedEventIds() {
    // Uses studentID to check saved events (for save/unsave button)
    const studentID = localStorage.getItem('studentID') || localStorage.getItem('StudentID');
    if (!studentID) return;

    try {
        // Fetch saved events from backend
        const response = await fetch(`http://localhost:3000/student/saved-events/${studentID}`);
        const savedEvents = await response.json();

        // Update local set for quick checks
        if (Array.isArray(savedEvents)) {
            savedEventIds = new Set(savedEvents.map(e => String(e.eventID)));
        }
    } catch (error) {
        console.error('Error loading saved event IDs:', error);
    }
}

// Save an event for the student
async function saveEvent(eventID, ev) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    const studentID = localStorage.getItem('studentID') || localStorage.getItem('StudentID');
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
        
        // Update local set and UI button state
        savedEventIds.add(String(eventID));
        updateEventCardButton(eventID, 'saved');
        
    } catch (e) {
        console.error('Save event error:', e);
        alert('Could not save event.');
    }
}

// Remove a saved event for the student
async function removeSavedEvent(eventID, ev) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    const studentID = localStorage.getItem('studentID') || localStorage.getItem('StudentID');
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
        
        // Update local set and UI button state
        savedEventIds.delete(String(eventID));
        updateEventCardButton(eventID, 'unsaved');
        
    } catch (e) {
        console.error('Remove saved event error:', e);
        alert('Could not remove saved event.');
    }
}

// Helper function to update button state without re-rendering the whole grid
function updateEventCardButton(eventID, state) {
    const card = document.querySelector(`.event-card[data-event-id='${eventID}']`);
    const container = card ? card.querySelector('.save-control-container') : null;
    if (!container) return;
    
    let newButtonHTML = '';
    if (state === 'saved') {
        // Use the new unsave-btn class for styling
        newButtonHTML = `<button class="unsave-btn" data-event-id="${eventID}" onclick="removeSavedEvent(${eventID}, event)">Saved ✓ (Remove)</button>`;
    } else {
        // Use the new save-btn class for styling
        newButtonHTML = `<button class="save-btn" data-event-id="${eventID}" onclick="saveEvent(${eventID}, event)">⭐ Save</button>`;
    }
    container.innerHTML = newButtonHTML;
}

async function fetchOrganizations() {
    const select = document.getElementById('organizationFilter');
    if (!select) return;
    try {
        const res = await fetch('http://localhost:3000/events/organizations');
        const payload = await res.json();
        const orgs = Array.isArray(payload?.data) ? payload.data : [];

        select.innerHTML = '<option value="">All Organizations</option>';

        orgs.forEach(org => {
            const opt = document.createElement('option');
            opt.value = org;
            opt.textContent = org;
            select.appendChild(opt);
        });
    } catch (e) {
        console.error('Error loading organizations:', e);
    }
}

async function fetchEventsFromDatabase() {
    const url = "http://localhost:3000/events";
    const container = document.getElementById("results");

    try {
        container.innerHTML = '<p style="padding:40px; text-align:center;">Loading events...</p>';

        const res = await fetch(url);
        const eventList = await res.json();
        console.log("THE RESULT IS: ", eventList);

        // Handle response - check if data is in eventList.data or directly in eventList
        allEvents = eventList.data || eventList || [];

        if (allEvents.length === 0) {
            container.innerHTML = '<p style="padding:40px; text-align:center; color:#666;">No events currently available.</p>';
        } else {
            displayResults(allEvents);
        }
    } catch (error) {
        console.error("Error fetching events:", error);
        container.innerHTML = '<p style="padding:40px; text-align:center; color:red;">Failed to load events. Please try again later.</p>';
    }
}

function filterEvents() {
    const query = document.getElementById("searchInput").value.toLowerCase();
    const category = document.getElementById("categoryFilter").value;
    const organization = document.getElementById("organizationFilter").value;
    const date = document.getElementById("dateFilter").value;

    const results = allEvents.filter(event => {
        // Convert database fields to match filter logic
        const eventName = event.eventName || "";
        const eventType = event.eventType || "";
        const eventOrg = event.Organization || "";
        const eventDate = event.startTime ? new Date(event.startTime).toISOString().split('T')[0] : "";

        return (
            eventName.toLowerCase().includes(query) &&
            (category === "" || eventType.toLowerCase() === category.toLowerCase()) &&
            (organization === "" || eventOrg.toLowerCase() === organization.toLowerCase()) &&
            (date === "" || eventDate === date)
        );
    });

    displayResults(results);
}

function displayResults(results) {
    const container = document.getElementById("results");

    if (!results || results.length === 0) {
        container.innerHTML = '<p style="padding:40px; text-align:center; color:#666;">No matching events found.</p>';
        return;
    }

    container.innerHTML = results.map(e => {
        const startDate = e.startTime ? new Date(e.startTime).toLocaleDateString() : "TBA";
        const startTime = e.startTime ? new Date(e.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "";
        const isPaidEvent = Number(e.eventPrices) > 0;
        
        // Display price with discount if applicable
        let priceDisplay = "Free";
        if (isPaidEvent) {
            if (e.hasDiscount && e.discountedPrice !== undefined) {
                priceDisplay = `<span style="text-decoration: line-through; color: #999; margin-right: 8px;">$${e.originalPrice.toFixed(2)}</span><strong style="color: #e74c3c;">$${e.discountedPrice.toFixed(2)}</strong> <span style="color: #27ae60; font-size: 0.9em;">(${e.discountPercent}% off)</span>`;
            } else {
                priceDisplay = `$${e.eventPrices}`;
            }
        }
        
        const isClaimed = claimedEventIds.has(String(e.eventID));
        const safeEventName = (e.eventName || '').replace(/'/g, "\\'");
        const claimLabel = isPaidEvent ? 'Buy Ticket' : 'Claim Ticket';
        const claimControl = isClaimed
            ? `<span class="claimed-label" style="display:inline-block;padding:8px 12px;border-radius:6px;background:#eef;color:#556;">Ticket already claimed</span>`
            : `<button class="claim-ticket-btn" data-event-id="${e.eventID}" onclick="claimTicket('${e.eventID}', '${safeEventName}')">\ud83c\udf9f\ufe0f ${claimLabel}</button>`;
        
        // **EXISTING LOGIC**: Check saved state and create button HTML
        const isSaved = savedEventIds.has(String(e.eventID));
        const saveControl = isSaved
            ? `<button class="unsave-btn" data-event-id="${e.eventID}" onclick="removeSavedEvent(${e.eventID}, event)">Saved ✓ (Remove)</button>`
            : `<button class="save-btn" data-event-id="${e.eventID}" onclick="saveEvent(${e.eventID}, event)">⭐ Save</button>`;

        const icsHref = `http://localhost:3000/calendar/${e.eventID}`;

        return `
            <div class="event-card" data-event-id="${e.eventID}">               <div class="event-info">
                <h2>${e.eventName}</h2>
                <p><strong>Hosted by:</strong> ${e.organizerUserName}</p>
                 <p><strong>Organization:</strong> ${e.Organization}</p>
                <p><strong>Type:</strong> ${e.eventType}</p>
                <p>\ud83d\udcc5 ${startDate} ${startTime}</p>
                <p>\ud83d\udccd ${e.location}</p>
                <p><strong>Price:</strong> ${priceDisplay}</p>
                <p><strong>Number of Participants:</strong> ${e.currentParticipants} / ${e.maxParticipants}</p>
                <p style="font-size:0.9em; color:#666;">${e.eventDescription}</p>
                <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                  ${claimControl}
                                    <div class="save-control-container">${saveControl}</div> 
                  <a class="add-to-cal" href="${icsHref}" download style="padding:8px 12px;border:1px solid #ccc;border-radius:6px;text-decoration:none;">\ud83d\udcc5 Add to Calendar</a>
                </div>
              </div>
            </div>
          `;
    }).join("");
}

// Claim ticket flow: calls backend to create ticket and returns a QR code to display
async function claimTicket(eventID, eventName) {
    try {
        const studentID = localStorage.getItem('studentID') || localStorage.getItem('StudentID');
        let email = localStorage.getItem('studentEmail') || localStorage.getItem('email');

        if (!studentID) {
            alert('Please log in as a student first.');
            return;
        }

        const attemptClaim = async (mockPaid = false) => {
            const res = await fetch('http://localhost:3000/claim-tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventID, studentID, email, mockPaid })
            });
            let payload = {};
            try { payload = await res.json(); } catch(error) {
                throw `Exception caught when trying to attempt claim ${error}`;
            }
            return { res, payload };
        };

        let { res, payload } = await attemptClaim(false);

        if (res.status === 402) {
            const price = typeof payload.price !== 'undefined' ? payload.price : 'unknown';
            const priceDisplay = typeof price === 'number' ? price.toFixed(2) : price;
            const proceed = confirm(`This event requires payment. Proceed with mock payment of $${priceDisplay}?`);
            if (!proceed) return;
            ({ res, payload } = await attemptClaim(true));
        }

        if (!res.ok) {
            alert(payload.error || 'Failed to claim ticket.');
            return;
        }

        // Mark as claimed in the current UI
        claimedEventIds.add(String(eventID));
        const btn = document.querySelector(`button.claim-ticket-btn[data-event-id='${eventID}']`);
        if (btn) {
            const label = document.createElement('span');
            label.className = 'claimed-label';
            label.style.display = 'inline-block';
            label.style.padding = '8px 12px';
            label.style.borderRadius = '6px';
            label.style.background = '#eef';
            label.style.color = '#556';
            label.textContent = 'Ticket already claimed';
            btn.replaceWith(label);
        }

        // Expecting: { message, ticketID, qrCode: dataUrl }
        showTicketModal({
            eventName,
            ticketID: payload.ticketID,
            qrCodeDataUrl: payload.qrCode
        });
    } catch (err) {
        console.error('Claim ticket error:', err);
        alert('Network error. Please try again.');
    }
}

function showTicketModal({ eventName, ticketID, qrCodeDataUrl }) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.5)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '9999';

    const card = document.createElement('div');
    card.style.background = '#fff';
    card.style.padding = '24px';
    card.style.borderRadius = '12px';
    card.style.maxWidth = '360px';
    card.style.width = '90%';
    card.style.textAlign = 'center';

    card.innerHTML = `
        <h2 style="margin:0 0 8px">Ticket Confirmed</h2>
        <p style="margin:0 0 16px">${eventName}</p>
        <img src="${qrCodeDataUrl}" alt="Ticket QR" style="width:200px;height:200px;border:1px solid #eee;border-radius:8px"/>
        <p style="margin:12px 0 16px;font-size:0.9em;color:#555">Ticket ID: ${ticketID}</p>
        <div style="display:flex;gap:8px;justify-content:center">
            <button id="closeTicketModal" style="padding:8px 12px">Close</button>
            <a id="downloadQR" download="ticket_${ticketID}.png" href="${qrCodeDataUrl}" style="padding:8px 12px;background:#0a7; color:#fff; text-decoration:none; border-radius:6px">Download QR</a>
        </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // For download of QR code
const downloadLink = card.querySelector('#downloadQR');
if (downloadLink) {
  downloadLink.addEventListener('click', async (ev) => {
    ev.preventDefault(); // stop native behavior
    const href = downloadLink.href;
    const filename = downloadLink.getAttribute('download') || `ticket_${ticketID}.png`;

    try {
      // fetch works for data: URLs and http(s) URLs (if same-origin or CORS allowed)
      const res = await fetch(href);
      if (!res.ok) throw new Error('Network response not ok: ' + res.status);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      console.log('QR download triggered:', filename);
    } catch (err) {
      console.error('QR download failed:', err);
      // Fallback: open image in new tab so user can save manually
      window.open(href, '_blank');
    }
  });
}

    overlay.addEventListener('click', (e) => {
    // Don't close on overlay click - only on explicit close button
    e.preventDefault();
    e.stopPropagation();
});
    card.querySelector('#closeTicketModal').addEventListener('click', () => {
        document.body.removeChild(overlay);
    });
}

// Expose function for inline onclick
window.claimTicket = claimTicket;
window.saveEvent = saveEvent;
window.removeSavedEvent = removeSavedEvent;