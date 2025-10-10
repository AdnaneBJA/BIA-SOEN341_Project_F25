const form = document.getElementById("userinfo");
const username = document.getElementById("username");
const password = document.getElementById("password");
const role = document.getElementById("role");
const successMessage = document.getElementById("success-message");

const sendData = async () => {
    const selectedRole = role.value;

    if (!selectedRole) {
        alert("Please select a role (Organizer or Student)");
        return;
    }

    const userData = {
        username: username.value,
        password: password.value,
    };

    let endpoint = "";
    if (selectedRole === "organizer") {
        endpoint = "http://localhost:3000/organizer";
    } else if (selectedRole === "student") {
        endpoint = "http://localhost:3000/student";
    } else {
        alert("Invalid role selected.");
        return;
    }

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
    };

    try {
        const response = await fetch(endpoint, requestOptions);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        await response.json();

        successMessage.classList.add("show");

        setTimeout(() => {
            successMessage.classList.add("fade-out");
        }, 3000);

        form.reset();
    } catch (err) {
        console.error("Error sending data:", err);
        alert("Error creating account. Check console for details.");
    }
};

form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendData();
});

document.addEventListener('DOMContentLoaded', () => {
    const role = localStorage.getItem('role');
    const hasOrganizer = localStorage.getItem('organizerUsername');
    const hasStudent = localStorage.getItem('studentUsername');
    const hasAdmin = localStorage.getItem('adminUsername');

    if (role || hasOrganizer || hasStudent || hasAdmin) {
        window.location.href = '../login/login.html';
    }
});
