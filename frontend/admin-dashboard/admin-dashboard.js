function updateAdminUserStatus(){
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

// Analytics and Charts functionality
async function initializeAnalytics() {
    const baseUrl = 'http://localhost:3000/analytics';

    function createChart(ctx, type, labels, data, label) {
        return new Chart(ctx, {
            type,
            data: {
                labels: labels.length ? labels : ['No data'],
                datasets: [{
                    label,
                    data: data.length ? data : [0],
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    fill: type === 'line',
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { precision: 0 }
                    }
                }
            }
        });
    }

    try {
        // For the Summary
        const summary = await fetch(`${baseUrl}/summary`).then(res => res.json());
        document.getElementById('totalEvents').textContent = summary.totalEvents;
        document.getElementById('totalTickets').textContent = summary.totalTickets;
        document.getElementById('totalParticipants').textContent = summary.totalParticipants;

        // For the Ticket trends
        const ticketData = await fetch(`${baseUrl}/tickets/monthly`).then(res => res.json());
        const ticketLabels = ticketData.map(row => new Date(row.month).toLocaleString('default', { month: 'short', year: 'numeric' }));
        const ticketCounts = ticketData.map(row => parseInt(row.tickets_sold));

        createChart(
            document.getElementById('ticketsChart'),
            'line',
            ticketLabels,
            ticketCounts,
            'Tickets Sold per Month'
        );

        // For the Participation by event type
        const participationData = await fetch(`${baseUrl}/participation/type`).then(res => res.json());
        const typeLabels = participationData.map(row => row.eventType || 'Unknown');
        const participantCounts = participationData.map(row => parseInt(row.participants));

        createChart(
            document.getElementById('participationChart'),
            'bar',
            typeLabels,
            participantCounts,
            'Participants per Event Type'
        );

    } catch (err) {
        console.error('Error loading analytics:', err);
    }
}

// // expose on window for non-module consumers
// try { window.fetchTotalEvents = fetchTotalEvents; } catch (e) { /* ignore */ }

document.addEventListener('DOMContentLoaded', () => {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    updateAdminUserStatus();

    // Initialize analytics and charts
    initializeAnalytics();

    const disconnectBtn = document.getElementById('disconnect-btn');
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', () => {
            logoutAdmin();
            localStorage.clear();
            alert('You have been logged out.');
            window.location.href = '../main-page/mainpage.html';
        });
    }

    // Event listeners for Management section buttons
    const manageOrgBtn = document.getElementById('manage-org-btn');
    if (manageOrgBtn) {
        manageOrgBtn.addEventListener('click', function() {
            const orgRoot = document.getElementById('org-root');
            orgRoot.style.display = 'block';
            ReactDOM.createRoot(orgRoot).render(React.createElement(AdminOrganizations));
        });
    }

    const assignRolesBtn = document.getElementById('assign-roles-btn');
    if (assignRolesBtn) {
        assignRolesBtn.addEventListener('click', function() {
            const orgRoot = document.getElementById('org-root');
            orgRoot.style.display = 'block';
            ReactDOM.createRoot(orgRoot).render(React.createElement(RoleManager));
        });
    }
});

// // retrieve total active events
// export async function fetchTotalEvents() {
//   try {
//     const resp = await fetch('http://localhost:3000/events/total'); 
//     if (!resp.ok) throw new Error('Network response was not ok');
//     const body = await resp.json();
//     let count = Number(body.data ?? 0);
//     if (!Number.isFinite(count)) count = 0;
//     document.getElementById('totalEventsValue').textContent = count.toLocaleString();
//   } catch (e) {
//     console.error('Failed to load total events', e);
//     document.getElementById('totalEventsValue').textContent = '—';
//   }
// }
