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
    } else{
        showButtons();
    }
}

function showButtons(){
    const buttonRow = document.querySelector('.button-row');
    const buttons = buttonRow.querySelectorAll('button');
    buttonRow.classList.add('show');
    buttons.forEach((btn, i) => {
        setTimeout(() => {
            btn.style.opacity = 1;
        }, i * 600);
    });
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

    type();
});
