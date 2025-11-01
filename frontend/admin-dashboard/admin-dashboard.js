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

// // expose on window for non-module consumers
// try { window.fetchTotalEvents = fetchTotalEvents; } catch (e) { /* ignore */ }

document.addEventListener('DOMContentLoaded', () => {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    updateAdminUserStatus();

    const disconnectBtn = document.getElementById('disconnect-btn');
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', () => {
            logoutAdmin();
            localStorage.clear();
            alert('You have been logged out.');
            window.location.href = '../main-page/mainpage.html';
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

