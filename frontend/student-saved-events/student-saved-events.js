// Global variable to store saved event data
let allSavedEvents = [];

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Check user status from dashboard.js
    // Assuming updateUserStatus from student-dashboard.js runs and redirects if needed.
    
    // 2. Fetch all saved events and populate the page
    await fetchAllSavedEvents();
});

async function fetchAllSavedEvents() {
    const studentID = localStorage.getItem('studentID');
    const container = document.getElementById("results");

    if (!studentID) {
        container.innerHTML = `<div class="empty-state"><p class="empty-state-text">Please log in to view your saved events.</p></div>`;
        return;
    }

    try {
        container.innerHTML = '<p class="loading-text">Loading your full saved events list...</p>';
        
        // ** Backend endpoint for ALL saved events **
        const url = `http://localhost:3000/student/saved-events/${studentID}`; 
        
        const response = await fetch(url);
        const eventList = await response.json(); 

        allSavedEvents = Array.isArray(eventList) ? eventList : eventList.data || []; 

        if (allSavedEvents.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⭐</div>
                    <p class="empty-state-text">You haven't saved any events yet.</p>
                    <button class="empty-state-btn" onclick="location.href='../event-discovery/event-discovery.html'">Browse Events</button>
                </div>`;
        } else {
            // Display all fetched events immediately
            displaySavedEvents(allSavedEvents);
        }
    } catch (error) {
        console.error("Error fetching saved events:", error);
        container.innerHTML = `<div class="empty-state"><p class="empty-state-text">⚠️ Failed to load saved events. Please check your network connection.</p></div>`;
    }
}

function displaySavedEvents(results) {
    const container = document.getElementById("results");

    if (!results || results.length === 0) {
        container.innerHTML = '<p class="empty-state-text" style="text-align:center;">No saved events found.</p>';
        return;
    }

    container.innerHTML = results.map(event => {
        const start = event.startTime ? new Date(event.startTime) : null;
        const dateText = start ? start.toLocaleDateString() : 'TBA';
        const timeText = start ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        const icsHref = `http://localhost:3000/calendar/${event.eventID}`;

        // Simplified price display
        let priceDisplay = (event.eventPrices && event.eventPrices > 0) ? `$${event.eventPrices}` : 'Free';
        if (event.hasDiscount && event.discountedPrice !== undefined) {
            priceDisplay = `<span style="text-decoration: line-through; color: #999; margin-right: 4px; font-size: 0.85em;">$${event.originalPrice.toFixed(2)}</span><strong style="color: #e74c3c;">$${event.discountedPrice.toFixed(2)}</strong>`;
        }
        
        return `
            <div class="event-card" data-event-id="${event.eventID}" onclick="viewEvent(${event.eventID})">
                <h3>${event.eventName}</h3>
                <p><strong>Date:</strong> ${dateText} ${timeText}</p>
                <p><strong>Location:</strong> ${event.location || 'TBA'}</p>
                <p><strong>Price:</strong> ${priceDisplay}</p>
                <span class="event-type">${event.eventType || 'General'}</span>
                
                <div class="event-actions" style="display:flex;gap:8px;align-items:center;margin-top:12px;">
                    <a class="btn" href="${icsHref}" download>📅 Add to Calendar</a>
                    <button class="unsave-btn btn-danger" data-event-id="${event.eventID}" onclick="removeSavedEvent(${event.eventID}, event)">Remove</button>
                </div>
            </div>`;
    }).join('');
}

// Override or ensure access to the removal function globally
// We need to re-implement the removeSavedEvent logic here to allow re-loading the list.
async function removeSavedEvent(eventID, ev) {
    if (ev && ev.stopPropagation) ev.stopPropagation(); // Prevent card click
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
        
        // Success: Re-fetch and display the list to remove the card immediately
        await fetchAllSavedEvents();
        
    } catch (e) {
        console.error('Remove saved event error:', e);
        alert('Could not remove saved event.');
    }
}

window.removeSavedEvent = removeSavedEvent;