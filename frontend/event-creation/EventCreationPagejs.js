function togglePriceInput() {
    const priceGroup = document.getElementById('priceGroup');
    const priceInput = document.getElementById('price');
    const paidRadio = document.querySelector('input[name="ticketType"][value="paid"]');
    
    if (paidRadio.checked) {
        priceGroup.classList.add('active');
        priceInput.required = true;
    } else {
        priceGroup.classList.remove('active');
        priceInput.required = false;
        priceInput.value = '0'; // Set to 0 when free is selected
    }
}

function handleSubmit(event) {
    event.preventDefault();
    console.log("Organizer ID: ", localStorage.getItem("organizerID"));


    // Get the ticket type and set price accordingly
    const ticketType = document.querySelector('input[name="ticketType"]:checked').value;
    let finalPrice = 0;
    
    if (ticketType === 'paid') {
        finalPrice = parseInt(document.getElementById('price').value) || 0;
    } else {
        finalPrice = 0; // Ensure free events have price 0
    }
    
    const formData = {
        eventName: document.getElementById('title').value,
        organizerUserName: localStorage.getItem("organizerUsername"), // Get from the new input field
        eventType: document.getElementById('category').value,
        startTime: new Date(document.getElementById('date').value + 'T' + document.getElementById('startTime').value).toISOString(),
        endTime: new Date(document.getElementById('date').value + 'T' + document.getElementById('endTime').value).toISOString(),
        location: document.getElementById('location').value,
        maxParticipants: parseInt(document.getElementById('capacity').value),
        eventPrices: finalPrice, // This will be 0 for free events, integer price for paid events
        eventDescription: document.getElementById('description').value,
        Organization: document.getElementById('organization').value
    };
    
    console.log('Event Created:', formData);
    
    // Send to backend
    fetch('http://localhost:3000/events', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })

    //or do async version
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        alert('Event created successfully!');
        document.getElementById('eventForm').reset();
        togglePriceInput(); // Reset the price input visibility
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('Error creating event. Please try again.');
    });
}

function resetForm() {
    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
        document.getElementById('eventForm').reset();
        togglePriceInput(); // Reset the price input visibility
    }
}

// Initialize the form when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Set minimum date to today
    document.getElementById('date').min = new Date().toISOString().split('T')[0];
    // Initialize the price input visibility (should be hidden by default since "free" is checked)
    togglePriceInput();

    // Show user info in navbar
    const username = localStorage.getItem('organizerUsername') || '';
    const role = localStorage.getItem('role') || '';
    document.querySelector('.status-username').textContent = username;
    document.querySelector('.role-badge').textContent = role;

    // Disconnect button logic
    document.getElementById('disconnect-btn').onclick = function() {
        localStorage.clear();
        window.location.href = '../login/login.html';
    };
});