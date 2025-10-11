const events = [
    { name: "Hackathon 2025", category: "Tech", organization: "CS Society", date: "2025-10-15", location: "EV Building" },
    { name: "Open Mic Night", category: "Arts", organization: "Student Union", date: "2025-10-18", location: "Hall Building" },
    { name: "Career Fair", category: "Tech", organization: "Student Union", date: "2025-10-20", location: "MB Building" },
    { name: "Volleyball Tournament", category: "Sports", organization: "Athletics", date: "2025-10-22", location: "Gymnasium" },
];

// Global variable to store events from database
let allEvents = [];

// Fetch events from database on page load
document.addEventListener("DOMContentLoaded", async () => {
    await fetchEventsFromDatabase();
});

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
                <button onclick="claimTicket('${e.eventID}', '${e.eventName}')">🎟️ Claim Ticket</button>
              </div>
            </div>
          `;
    }).join("");
}


