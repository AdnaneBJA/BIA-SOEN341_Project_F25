// Global variable to store ticket data
let allTickets = [];

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Fetch all tickets and populate the page
    await fetchTicketsFromDatabase();
    
    // 2. No event listeners needed since search/filter is removed
});

async function fetchTicketsFromDatabase() {
    const studentID = localStorage.getItem('studentID');
    const container = document.getElementById("results");

    if (!studentID) {
        container.innerHTML = `<div class="empty-state"><p class="empty-state-text">Please log in to view your tickets.</p></div>`;
        return;
    }

    try {
        container.innerHTML = '<p class="loading-text">Loading your full ticket list...</p>';
        
        // ** Backend endpoint for ALL tickets **
        const url = `http://localhost:3000/student/tickets/${studentID}`; 
        
        const response = await fetch(url);
        const ticketList = await response.json(); 

        allTickets = Array.isArray(ticketList) ? ticketList : ticketList.data || []; 

        if (allTickets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🎟️</div>
                    <p class="empty-state-text">You have no claimed or purchased tickets.</p>
                    <button class="empty-state-btn" onclick="location.href='../event-discovery/event-discovery.html'">Browse Events</button>
                </div>`;
        } else {
            // Display all fetched tickets immediately
            displayTickets(allTickets);
        }
    } catch (error) {
        console.error("Error fetching tickets:", error);
        container.innerHTML = `<div class="empty-state"><p class="empty-state-text">⚠️ Failed to load tickets. Please check your network connection.</p></div>`;
    }
}

function displayTickets(results) {
    const container = document.getElementById("results");

    if (!results || results.length === 0) {
        container.innerHTML = '<p class="empty-state-text" style="text-align:center;">No tickets found.</p>';
        return;
    }

    container.innerHTML = results.map(ticket => {
        const eventDate = ticket.eventDate ? new Date(ticket.eventDate) : null;
        const dateText = eventDate ? eventDate.toLocaleDateString() : 'TBA';
        const timeText = eventDate ? eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        
        const status = ticket.status || (ticket.valid ? 'Active' : 'Invalid');
        const statusClass = status.toLowerCase(); 
        
        // 1. **URL Construction (Copied from dashboard.js)**
        const qrSrc = ticket.qrCodeUrl ? `http://localhost:3000${ticket.qrCodeUrl}` : '';

        return `
            <div class="ticket-card" onclick="showTicketDetails(${ticket.ticketID}, '${ticket.eventName}')">
                <div class="ticket-card-header">
                    <h3>${ticket.eventName || 'Event Details Missing'}</h3>
                    <span class="ticket-status ${statusClass}">${status}</span>
                </div>
                <p><strong>Date:</strong> ${dateText} ${timeText}</p>
                <p><strong>Location:</strong> ${ticket.location || 'TBA'}</p>
                <p><strong>Ticket ID:</strong> #${ticket.ticketID}</p>
                
                ${qrSrc ? `<div class="ticket-qr-container"><img src="${qrSrc}" alt="QR for ticket #${ticket.ticketID}" class="ticket-qr-image"/></div>` : ''}

            </div>
        `;
    }).join('');
}