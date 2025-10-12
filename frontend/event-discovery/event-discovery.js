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

// Fetch events from database on page load
document.addEventListener("DOMContentLoaded", async () => {
    await prefetchClaimedTickets();
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
        const price = e.eventPrices > 0 ? `$${e.eventPrices}` : "Free";
        const isClaimed = claimedEventIds.has(String(e.eventID));
        const safeEventName = (e.eventName || '').replace(/'/g, "\\'");
        const claimControl = isClaimed
            ? `<span class="claimed-label" style="display:inline-block;padding:8px 12px;border-radius:6px;background:#eef;color:#556;">Ticket already claimed</span>`
            : `<button class="claim-ticket-btn" data-event-id="${e.eventID}" onclick="claimTicket('${e.eventID}', '${safeEventName}')">🎟️ Claim Ticket</button>`;

        return `
            <div class="event-card">
              <div class="event-info">
                <h2>${e.eventName}</h2>
                <p><strong>Hosted by:</strong> ${e.organizerUserName}</p>
                 <p><strong>Organization:</strong> ${e.Organization}</p>
                <p><strong>Type:</strong> ${e.eventType}</p>
                <p>📅 ${startDate} ${startTime}</p>
                <p>📍 ${e.location}</p>
                <p><strong>Price:</strong> ${price}</p>
                <p><strong>Number of Participants:</strong> ${e.currentParticipants} / ${e.maxParticipants}</p>
                <p style="font-size:0.9em; color:#666;">${e.eventDescription}</p>
                ${claimControl}
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
        if (!email) {
            email = prompt('Enter your email to receive the ticket QR code:');
            if (!email) return;
            // cache for next time
            localStorage.setItem('studentEmail', email);
        }

        const res = await fetch('http://localhost:3000/claim-tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventID, studentID, email })
        });

        const payload = await res.json().catch(() => ({}));
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

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) document.body.removeChild(overlay);
    });
    card.querySelector('#closeTicketModal').addEventListener('click', () => {
        document.body.removeChild(overlay);
    });
}

// Expose function for inline onclick
window.claimTicket = claimTicket;
