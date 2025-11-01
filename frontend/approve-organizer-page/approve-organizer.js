document.addEventListener('DOMContentLoaded', async () => {
    updateUserStatus();
    setupDisconnectButton();
    await loadOrganizers();
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

async function loadOrganizers() {
    const loadingMsg = document.getElementById('loading-message');
    const errorMsg = document.getElementById('error-message');
    const organizersList = document.getElementById('organizers-list');

    try {
        const response = await fetch('http://localhost:3000/organizers');

        if (!response.ok) {
            throw new Error('Failed to fetch organizers');
        }

        const organizers = await response.json();

        // Hide loading message
        if (loadingMsg) loadingMsg.style.display = 'none';

        if (organizers.length === 0) {
            organizersList.innerHTML = `
                <div class="empty-state">
                    <h3>No Organizers Found</h3>
                    <p>There are currently no organizers in the system.</p>
                </div>
            `;
            return;
        }

        organizersList.innerHTML = organizers.map(organizer => createOrganizerCard(organizer)).join('');

        attachButtonListeners();

    } catch (error) {
        console.error('Error loading organizers:', error);
        if (loadingMsg) loadingMsg.style.display = 'none';
        if (errorMsg) {
            errorMsg.textContent = 'Failed to load organizers. Please try again later.';
            errorMsg.style.display = 'block';
        }
    }
}

function createOrganizerCard(organizer) {
    const isApproved = organizer.approved === true;
    const statusClass = isApproved ? 'approved' : 'pending';
    const statusText = isApproved ? 'Approved' : 'Pending Approval';

    return `
        <div class="organizer-card" data-organizer-id="${organizer.organizerID}">
            <div class="organizer-info">
                <h3 class="organizer-name">${escapeHtml(organizer.organizerUserName)}</h3>
                <p class="organizer-id">Organizer ID: ${organizer.organizerID}</p>
                <span class="organizer-status ${statusClass}">${statusText}</span>
            </div>
            <div class="organizer-actions">
                ${isApproved 
                    ? `<button class="btn-revoke" data-organizer-id="${organizer.organizerID}" data-action="revoke">
                         Remove Approval
                       </button>`
                    : `<button class="btn-approve" data-organizer-id="${organizer.organizerID}" data-action="approve">
                         Approve Organizer
                       </button>`
                }
            </div>
        </div>
    `;
}

function attachButtonListeners() {
    const approveButtons = document.querySelectorAll('.btn-approve');
    const revokeButtons = document.querySelectorAll('.btn-revoke');

    approveButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            const organizerID = e.target.getAttribute('data-organizer-id');
            await toggleApproval(organizerID, true);
        });
    });

    revokeButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            const organizerID = e.target.getAttribute('data-organizer-id');
            const confirmed = confirm('Are you sure you want to remove approval for this organizer? They will no longer be able to create events.');
            if (confirmed) {
                await toggleApproval(organizerID, false);
            }
        });
    });
}

async function toggleApproval(organizerID, approve) {
    try {
        const response = await fetch('http://localhost:3000/organizers/toggle-approval', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                organizerID: parseInt(organizerID),
                approved: approve
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update approval status');
        }

        const result = await response.json();
        console.log(result.message);

        await loadOrganizers();

        showSuccessMessage(approve ? 'Organizer approved successfully!' : 'Approval removed successfully!');

    } catch (error) {
        console.error('Error toggling approval:', error);
        alert('Failed to update approval status: ' + error.message);
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
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
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

