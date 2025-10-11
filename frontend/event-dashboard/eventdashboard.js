// Populate dropdown
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
        });
    }

    const select = document.getElementById("eventSelect");

    // Fetch real events from backend
    const allReceivedEventsFromBackend = await fetchEvents();
    console.log("Received: ", allReceivedEventsFromBackend);

    // Populate dropdown with real events
    if (allReceivedEventsFromBackend && allReceivedEventsFromBackend.length > 0) {
        allReceivedEventsFromBackend.forEach(event => {
            const option = document.createElement("option");
            option.value = event.eventID;
            option.textContent = event.eventName;
            select.appendChild(option);
        });

        // Show dashboard on selection
        select.addEventListener("change", async function () {
            const eventID = parseInt(this.value);
            const event = allReceivedEventsFromBackend.find(e => e.eventID === eventID);
            if (event) {
                const ticketsIssued = event.currentParticipants;

                const remainingCapacity = event.maxParticipants - ticketsIssued;
                const attendanceRate = ((event.currentParticipants / event.maxParticipants) * 100).toFixed(1);

                document.getElementById("dashboard").innerHTML = `
                    <h2>${event.eventName} Analytics</h2>
                    <table class="analytics-table">
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Tickets Issued</td>
                                <td>${event.currentParticipants}</td>
                            </tr>
                            <tr>
                                <td>Attendance Rate</td>
                                <td>${attendanceRate}%</td>
                            </tr>
                            <tr>
                                <td>Max Capacity</td>
                                <td>${event.maxParticipants}</td>
                            </tr>
                            <tr>
                                <td>Remaining Capacity</td>
                                <td>${remainingCapacity}</td>
                            </tr>
                        </tbody>
                    </table>
                `;

            }
        });

        // Display first event by default
        select.dispatchEvent(new Event("change"));
    } else {
        select.innerHTML = '<option>No events available</option>';
        document.getElementById("dashboard").innerHTML = '<p>No events to display.</p>';
    }
});


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
    }
}

async function fetchEvents() {
    try {
        const res = await fetch("http://localhost:3000/eventdashboard");
        return await res.json();
    } catch (error) {
        console.error("Error fetching events:", error);
        return [];
    }
}

async function getTicketsIssued(eventID) {
    try {
        const res = await fetch(`http://localhost:3000/eventdashboard/tickets-issued/${eventID}`);
        const ticketsData = await res.json();
        return ticketsData.total_tickets || 0;
    } catch (error) {
        console.error("Error fetching tickets:", error);
        return 0;
    }
}

async function loadTicketsIssued(eventID){
    try {
        const res = await fetch(`http://localhost:3000/eventdashboard/tickets-issued/${eventID}`);
        const ticketsData = await res.json();

        const chartCanvas = document.getElementById("ticketsIssuedChart");

        if (window.ticketsChart) {
            window.ticketsChart.destroy();
        }

        window.ticketsChart = new Chart(chartCanvas, {
            type: "bar",
            data: {
                labels: [ticketsData.eventName || "Event"],
                datasets: [{
                    label: "Tickets Issued per Event",
                    data: [Number(ticketsData.total_tickets) || 0],
                    backgroundColor: "#525175ff",
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error loading chart:", error);
    }
}
