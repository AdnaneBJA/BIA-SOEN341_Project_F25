document.addEventListener('DOMContentLoaded', async () => {
    updateUserStatus();
    setupDisconnectButton();
    await loadEvents();
});

function updateUserStatus() {
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

function setupDisconnectButton() {
    const disconnectBtn = document.getElementById('disconnect-btn');
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = '../main-page/mainpage.html';
        });
    }
}

async function loadEvents() {
    const loadingMsg = document.getElementById('loading-message');
    const errorMsg = document.getElementById('error-message');
    const eventsList = document.getElementById('events-list');

    try {
        const response = await fetch('http://localhost:3000/events');

        if (!response.ok) {
            throw new Error('Failed to fetch events');
        }

        const result = await response.json();
        const events = result.data || [];

        if (loadingMsg) loadingMsg.style.display = 'none';

        if (events.length === 0) {
            eventsList.innerHTML = `
                <div class="empty-state">
                    <h3>No Events Found</h3>
                    <p>There are currently no events in the system.</p>
                </div>
            `;
            return;
        }

        eventsList.innerHTML = events.map(event => createEventCard(event)).join('');

        attachButtonListeners();

    } catch (error) {
        console.error('Error loading events:', error);
        if (loadingMsg) loadingMsg.style.display = 'none';
        if (errorMsg) {
            errorMsg.textContent = 'Failed to load events. Please try again later.';
            errorMsg.style.display = 'block';
        }
    }
}

function createEventCard(event) {
    const startDate = new Date(event.startTime).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const endDate = new Date(event.endTime).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const price = event.eventPrices > 0 ? `$${event.eventPrices}` : 'Free';
    const capacity = `${event.currentParticipants || 0} / ${event.maxParticipants}`;

    return `
        <div class="event-card" data-event-id="${event.eventID}">
            <div class="event-header">
                <div class="event-title-section">
                    <h3 class="event-name">
                        ${escapeHtml(event.eventName)}
                        ${event.eventType ? `<span class="event-type">${escapeHtml(event.eventType)}</span>` : ''}
                    </h3>
                    <p class="event-organization">📍 ${escapeHtml(event.Organization)}</p>
                    <p class="event-organizer">Organizer: ${escapeHtml(event.organizerUserName)}</p>
                    <div class="event-stats">
                        <div class="event-stat">
                            <span class="event-stat-icon">👥</span>
                            <span class="event-stat-value">${capacity}</span>
                        </div>
                        <div class="event-stat">
                            <span class="event-stat-icon">💰</span>
                            <span class="event-stat-value">${price}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="event-details">
                <div class="event-detail-item">
                    <div class="event-detail-label">Start Time</div>
                    <div class="event-detail-value">${startDate}</div>
                </div>
                <div class="event-detail-item">
                    <div class="event-detail-label">End Time</div>
                    <div class="event-detail-value">${endDate}</div>
                </div>
                <div class="event-detail-item">
                    <div class="event-detail-label">Location</div>
                    <div class="event-detail-value">${escapeHtml(event.location)}</div>
                </div>
                <div class="event-detail-item">
                    <div class="event-detail-label">Event ID</div>
                    <div class="event-detail-value">#${event.eventID}</div>
                </div>
            </div>

            ${event.eventDescription ? `
                <div class="event-description">
                    <div class="event-description-label">Description</div>
                    <div class="event-description-text">${escapeHtml(event.eventDescription)}</div>
                </div>
            ` : ''}

            <div class="event-actions">
                <button class="btn-delete" data-event-id="${event.eventID}" data-event-name="${escapeHtml(event.eventName)}">
                    Delete Event
                </button>
            </div>
        </div>
    `;
}

function attachButtonListeners() {
    const deleteButtons = document.querySelectorAll('.btn-delete');

    deleteButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            const eventID = e.target.getAttribute('data-event-id');
            const eventName = e.target.getAttribute('data-event-name');

            const confirmed = confirm(
                `Are you sure you want to delete the event "${eventName}"?\n\n` +
                `This action cannot be undone and will:\n` +
                `• Remove the event from all listings\n` +
                `• Delete all associated tickets\n` +
                `• Notify participants (if implemented)`
            );

            if (confirmed) {
                await deleteEvent(eventID);
            }
        });
    });
}

async function deleteEvent(eventID) {
    try {
        const response = await fetch(`http://localhost:3000/events/${eventID}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete event');
        }

        const result = await response.json();
        console.log(result.message);

        await loadEvents();

        showSuccessMessage('Event deleted successfully!');

    } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event: ' + error.message);
    }
}

function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background-color: #e6f5ea;
        color: #1d6b2a;
        padding: 15px 25px;
        border-radius: 8px;
        border: 2px solid #b6e2c0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(successDiv);

    setTimeout(() => {
        successDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => successDiv.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

