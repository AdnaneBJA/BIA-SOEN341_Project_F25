const username = document.getElementById("username");
const password = document.getElementById("password");
const form = document.getElementById("login-form");
const successBox = document.getElementById("login-success");
const errorBox = document.getElementById("login-error");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (successBox) {
        successBox.textContent = '';
        successBox.classList.remove('show');
        successBox.style.display = 'none';
    }
    if (errorBox) {
        errorBox.textContent = '';
        errorBox.classList.remove('show');
        errorBox.style.display = 'none';
    }

    const data = {
        username: username.value,
        password: password.value,
    }

    const url = "http://localhost:3000/login";
    const requestBody = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    }

    try {
        const response = await fetch(url, requestBody);
        const receivedInfo = await response.json();

        if (!response.ok) {
            if (errorBox) {
                errorBox.textContent = receivedInfo?.error || 'Login failed. Please try again.';
                errorBox.classList.add('show');
                errorBox.style.display = 'block';
            }
            return;
        }

        console.log(receivedInfo);
        if (receivedInfo.message === "Successfully retrieved organizer information") {
            const organizerID = receivedInfo.data[0].organizerID;
            const organizerUsername = receivedInfo.data[0].organizerUserName;
            const organizerPassword = receivedInfo.data[0].organizerPassword;
            localStorage.setItem("organizerID", organizerID);
            localStorage.setItem("organizerUsername", organizerUsername);
            localStorage.setItem("organizerPassword", organizerPassword);
            localStorage.setItem("role", "Organizer");

            // Show styled success message
            if (successBox) {
                successBox.textContent = `Successfully logged in as ${organizerUsername}. Redirecting...`;
                successBox.classList.add("show");
                successBox.style.display = "block";
            }

            setTimeout(() => {
                window.location.href = "../main-page/organizerDashboard.html";
            }, 1500);
            return;
        }

        if (receivedInfo.message === "No users have the data entered") {
            if (errorBox) {
                errorBox.textContent = 'No matching user found. Please check your username and password.';
                errorBox.classList.add('show');
                errorBox.style.display = 'block';
            }
            return;
        }

        if (errorBox) {
            errorBox.textContent = receivedInfo?.error || 'Login failed. Please check your credentials.';
            errorBox.classList.add('show');
            errorBox.style.display = 'block';
        }
    } catch (e) {
        console.error(e);
        if (errorBox) {
            errorBox.textContent = 'Server error. Please try again later.';
            errorBox.classList.add('show');
            errorBox.style.display = 'block';
        }
    }

    console.log("SUBMITTED FORM WITH DATA: ", data);
})
