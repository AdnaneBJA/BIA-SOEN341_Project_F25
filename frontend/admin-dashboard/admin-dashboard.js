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
