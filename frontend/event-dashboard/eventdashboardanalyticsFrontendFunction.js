// Mock event data based on Events table schema
const mockEvents = [
    {
        eventID: 1,
        eventName: "Campus Concert",
        organizerID: 101,
        eventType: "Music",
        startTime: "2025-10-15T19:00:00",
        endTime: "2025-10-15T22:00:00",
        location: "Main Auditorium",
        maxParticipants: 200,
        currentParticipants: 150,
        eventPrices: 20,
        eventDescription: "Live music event featuring local bands.",
        organizerUserName: "musicOrg",
        Organization: "Music Club",
        ticketsIssued: 160,
        attendanceRate: 0.94, // 150/160
        remainingCapacity: 40 // 200-160
    },
    {
        eventID: 2,
        eventName: "Spring Play",
        organizerID: 102,
        eventType: "Arts & Theatre",
        startTime: "2025-11-01T18:00:00",
        endTime: "2025-11-01T20:00:00",
        location: "Drama Hall",
        maxParticipants: 100,
        currentParticipants: 80,
        eventPrices: 15,
        eventDescription: "Annual spring play performed by students.",
        organizerUserName: "theatreOrg",
        Organization: "Drama Society",
        ticketsIssued: 90,
        attendanceRate: 0.89, // 80/90
        remainingCapacity: 10 // 100-90
    },
    {
        eventID: 3,
        eventName: "Film Night",
        organizerID: 103,
        eventType: "Film",
        startTime: "2025-10-20T20:00:00",
        endTime: "2025-10-20T23:00:00",
        location: "Cinema Room",
        maxParticipants: 60,
        currentParticipants: 45,
        eventPrices: 10,
        eventDescription: "Screening of classic and indie films.",
        organizerUserName: "filmOrg",
        Organization: "Film Club",
        ticketsIssued: 50,
        attendanceRate: 0.90, // 45/50
        remainingCapacity: 10 // 60-50
    }
];

// Populate dropdown
document.addEventListener("DOMContentLoaded", function() {
    const select = document.getElementById("eventSelect");
    mockEvents.forEach(event => {
        const option = document.createElement("option");
        option.value = event.eventID;
        option.textContent = event.eventName;
        select.appendChild(option);
    });

    // Show dashboard on selection
    select.addEventListener("change", function() {
        const event = mockEvents.find(e => e.eventID == this.value);
        if (event) {
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
                            <td>${event.ticketsIssued}</td>
                        </tr>
                        <tr>
                            <td>Attendance Rate</td>
                            <td>${(event.attendanceRate * 100).toFixed(1)}%</td>
                        </tr>
                        <tr>
                            <td>Remaining Capacity</td>
                            <td>${event.remainingCapacity}</td>
                        </tr>
                    </tbody>
                </table>
            `;
        }
    });

    // Initial dashboard
    select.dispatchEvent(new Event("change"));
});

async function fetchEvents() {
    const res = await fetch("http://localhost:3000/Events");
    const events = await res.json();
    const select = document.getElementById("eventSelect");
    events.forEach(event => {
        const option = document.createElement("option");
        option.value = event.eventID;
        option.textContent = event.eventName;
        select.appendChild(option);
    });

    select.addEventListener("change", () => {
        loadTicketsIssued(select.value);
    });
}

async function loadTicketsIssued(eventID){
    const res = await fetch("http://localhost:3000/tickets-issued/${eventID}");
    const ticketsData = await res.json();

    const chartCanvas = document.getElementById("ticketsIssuedChart");

    if (window.ticketsChart) {
        window.ticketsChart.destroy();
    }

    window.ticketsChart = new Chart(chartCanvas, {
        type: "bar",
        data: {
            labels: [ticketsData.eventName],
            datasets: [{
                label: "Tickets Issued per Event",
                data: [Number(ticketsData.total_tickets)],
                backgroundColor: "#525175ff",
            }]
        }
    })
}
document.addEventListener("DOMContentLoaded", fetchEvents);
