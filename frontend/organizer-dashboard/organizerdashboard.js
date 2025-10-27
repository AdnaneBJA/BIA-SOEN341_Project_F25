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
            // Clear UI on logout
            const select = document.getElementById("eventSelect");
            const dash = document.getElementById("dashboard");
            if (select) select.innerHTML = '';
            if (dash) dash.innerHTML = '<p>Please log in as an organizer to view events.</p>';
        });
    }

    const select = document.getElementById("eventSelect");

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
        if (select) select.innerHTML = '<option>No events available</option>';
        const dash = document.getElementById("dashboard");
        if (dash) dash.innerHTML = '<p>No events to display.</p>';
    }
});

// Handle CSV export
function handleExport() {
    const select = document.getElementById('eventSelect');
    const eventID = select && select.value ? select.value : null;

    const organizerID = localStorage.getItem('organizerID');
    const organizerUsername = localStorage.getItem('organizerUsername');
    let identityQuery = '';
    if (organizerID) {
        identityQuery = `?organizerID=${encodeURIComponent(organizerID)}`;
    } else if (organizerUsername) {
        identityQuery = `?organizerUsername=${encodeURIComponent(organizerUsername)}`;
    }

    if (eventID) {
        const url = `http://localhost:3000/events/${encodeURIComponent(eventID)}/export-attendees${identityQuery}`;
        window.open(url, '_blank');
    } else {
        const url = `http://localhost:3000/export-attendees${identityQuery}`;
        window.open(url, '_blank');
    }
}

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
        const role = localStorage.getItem('role');
        if (role !== 'Organizer') {
            console.warn('Only organizers can view organizer dashboard events.');
            return [];
        }

        const organizerID = localStorage.getItem('organizerID');
        const organizerUsername = localStorage.getItem('organizerUsername');

        if (!organizerID && !organizerUsername) {
            console.warn('Organizer identity missing; refusing to fetch all events');
            return [];
        }

        let url = 'http://localhost:3000/eventdashboard';
        if (organizerID) {
            url += `?organizerID=${encodeURIComponent(organizerID)}`;
        } else if (organizerUsername) {
            url += `?organizerUsername=${encodeURIComponent(organizerUsername)}`;
        }

        const res = await fetch(url);
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

// QR Ticket Validation Logic
(function initQrValidation(){
    const dropzone = document.getElementById('qr-dropzone');
    const fileInput = document.getElementById('qr-file');
    const scanBtn = document.getElementById('scan-btn');
    const filenameEl = document.getElementById('qr-file-name');
    const resultEl = document.getElementById('validation-result');
    const manualInput = document.getElementById('ticket-id-input');
    const manualBtn = document.getElementById('validate-id-btn');

    if (!dropzone || !fileInput || !scanBtn || !resultEl || !manualInput || !manualBtn) return;

    // Helpers
    function setResult(text, ok){
        resultEl.textContent = text;
        resultEl.classList.remove('ok','err');
        resultEl.classList.add(ok ? 'ok' : 'err');
    }

    function clearResult(){
        resultEl.textContent = '';
        resultEl.classList.remove('ok','err');
    }

    function setFilename(name){
        filenameEl.textContent = name || '';
    }

    // Drag & drop
    ;['dragenter','dragover'].forEach(evt => dropzone.addEventListener(evt, e => {
        e.preventDefault(); e.stopPropagation();
        dropzone.classList.add('dragging');
    }));
    ;['dragleave','drop'].forEach(evt => dropzone.addEventListener(evt, e => {
        e.preventDefault(); e.stopPropagation();
        dropzone.classList.remove('dragging');
    }));
    dropzone.addEventListener('drop', e => {
        const files = e.dataTransfer?.files;
        if (files && files[0]) {
            fileInput.files = files;
            setFilename(files[0].name);
            clearResult();
        }
    });

    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        setFilename(fileInput.files && fileInput.files[0] ? fileInput.files[0].name : '');
        clearResult();
    });

    async function decodeQrFromFile(file){
        const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        const img = await new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = dataUrl;
        });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qr = window.jsQR ? window.jsQR(imageData.data, imageData.width, imageData.height) : null;
        return qr?.data || null;
    }

    async function validateTicketById(id){
        if (!id || !/^\d+$/.test(String(id))) {
            setResult('Please provide a valid numeric ticket ID', false);
            return;
        }
        try {
            const res = await fetch('http://localhost:3000/validate-ticket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketID: Number(id) })
            });
            const body = await res.json().catch(() => ({}));
            if (res.ok) {
                const ok = !!body.valid;
                const selected = document.getElementById('eventSelect');
                const selectedEventID = selected && selected.value ? Number(selected.value) : null;
                if (selectedEventID && body.eventID && Number(body.eventID) !== selectedEventID) {
                    setResult(`Ticket belongs to event #${body.eventID}, not the selected event`, false);
                    return;
                }
                setResult(body.message || (ok ? 'Ticket is valid' : 'Ticket invalid'), ok);
            } else if (res.status === 404) {
                setResult(body.message || 'Ticket not found', false);
            } else {
                setResult(body.error || 'Server error while validating', false);
            }
        } catch (e) {
            console.error('Validation request failed', e);
            setResult('Network error while validating ticket', false);
        }
    }

    scanBtn.addEventListener('click', async () => {
        clearResult();
        const file = fileInput.files && fileInput.files[0];
        if (!file) {
            setResult('Please select or drop a QR image first', false);
            return;
        }
        try {
            const data = await decodeQrFromFile(file);
            if (!data) {
                setResult('Could not find a QR code in this image', false);
                return;
            }
            // Our QR encodes the ticketID as a string
            await validateTicketById(data);
        } catch (e) {
            console.error('QR scan failed', e);
            setResult('Failed to scan the QR image', false);
        }
    });

    manualBtn.addEventListener('click', async () => {
        clearResult();
        const id = manualInput.value.trim();
        await validateTicketById(id);
    });
})();
