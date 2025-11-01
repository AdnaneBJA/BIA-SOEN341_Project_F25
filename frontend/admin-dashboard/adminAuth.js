// Hardcoded admin account
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: '123'
};

function isAdminLoggedIn() {
    return localStorage.getItem('adminIsLoggedIn') === 'true';
}

function loginAdmin(username, password) {
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        localStorage.setItem('adminIsLoggedIn', 'true');
        localStorage.setItem('adminAuthenticated', 'true');
        localStorage.setItem('role', 'Admin');
        localStorage.setItem('adminUsername', username);
        return true;
    }
    return false;
}

function logoutAdmin() {
    localStorage.removeItem('adminIsLoggedIn');
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('role');
    localStorage.removeItem('adminUsername');
}

function protectAdminPage() {
    if (!isAdminLoggedIn()) {
        alert('You must be logged in as admin to access this page.');
        window.location.href = '../main-page/mainpage.html';
    }
}
