const phrase = 
 "Welcome to Campus Events & Ticketing"
;

const typewriter = document.getElementById("typed");
let letterIndex = 0;

function type() {
    if (letterIndex < phrase.length) {
        typewriter.textContent += phrase.charAt(letterIndex);
        letterIndex++;
        setTimeout(type, 100);
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


document.addEventListener("DOMContentLoaded", () => {
    updateUserStatus();

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

    // Show title instantly for a smoother first paint (no waiting)
    const typedEl = document.getElementById('typed');
    if (typedEl) typedEl.textContent = phrase;

    // Intercept Organizer Dashboard button click: show popup for non-organizers and stay on page
    try {
        const organizerBtn = document.querySelector('button[onclick*="organizerdashboard.html"]');
        if (organizerBtn) {
            // Prevent the inline onclick from taking effect by removing it and handling navigation here
            organizerBtn.removeAttribute('onclick');
            organizerBtn.addEventListener('click', (e) => {
                const role = localStorage.getItem('role');
                    const low = role ? role.toLowerCase() : '';
                    if (low === 'organizer' || low === 'admin') {
                        // allow navigation for organizers and admins
                        window.location.href = '../organizer-dashboard/organizerdashboard.html';
                    } else if (!role) {
                        window.location.href = '../login/login.html';
                    } else {
                        // simple popup and remain on the main page
                        try { alert('Please log in as an organizer'); } catch (err) { console.warn('Alert unavailable', err); }
                    }
            });
        }
    } catch (e) {
        console.error('Failed to attach organizer button handler', e);
    }
});
