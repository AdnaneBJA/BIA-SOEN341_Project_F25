import React from 'react';
import { createRoot } from 'react-dom/client';
import AdminOrganizations from '../admin-dashboard/organizationMod';

// const container = document.getElementById('admin-root');
// const root = createRoot(container);
// root.render(<AdminOrganizations />);

//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// document.addEventListener('DOMContentLoaded', () => {
//     const btn = document.getElementById('manage-org-btn');
//     const orgRoot = document.getElementById('org-root');
//     if (btn && orgRoot) {
//         btn.addEventListener('click', () => {
//             orgRoot.style.display = 'block';
//             if (!orgRoot.hasChildNodes()) {
//                 const root = createRoot(orgRoot);
//                 root.render(<AdminOrganizations />);
//             }
//         });
//     }
// });
//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

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
            try { localStorage.clear(); } catch (e) { console.error('Failed to clear localStorage', e); }
            updateAdminUserStatus();
            setTimeout(() => location.reload(), 200);
        });
    }
});

