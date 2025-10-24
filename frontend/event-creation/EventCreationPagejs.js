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
    priceInput.value = '0';
  }
}

document.getElementById('eventForm').addEventListener('submit', function (e) {
  e.preventDefault();

  let valid = true;

  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const category = document.getElementById('category').value;
  const dateValue = document.getElementById('date').value;
  const startTime = document.getElementById('startTime').value;
  const endTime = document.getElementById('endTime').value;
  const location = document.getElementById('location').value.trim();
  const organization = document.getElementById('organization').value.trim();
  // const organizerUserName = document.getElementById('organizerUserName').value.trim();
  const capacity = document.getElementById('capacity').value;
  const ticketType = document.querySelector('input[name="ticketType"]:checked')?.value;
  const price = document.getElementById('price').value;

  // Clear errors
  document.querySelectorAll('.error-message').forEach(el => (el.textContent = ''));

  // Validations
  if (!title) { document.getElementById('titleError').textContent = 'Event title is required.'; valid = false; }
  if (!description) { document.getElementById('descriptionError').textContent = 'Description is required.'; valid = false; }
  if (!category) { document.getElementById('categoryError').textContent = 'Please select a category.'; valid = false; }

  if (!dateValue) {
    document.getElementById('dateError').textContent = 'Event date is required.';
    valid = false;
  } else {
    const today = new Date();
    today.setHours(0,0,0,0);
    const eventDate = new Date(dateValue);
    if (eventDate < today) {
      document.getElementById('dateError').textContent = 'Event date must be in the future.';
      valid = false;
    }
  }

  if (!startTime) { document.getElementById('startTimeError').textContent = 'Start time required.'; valid = false; }
  if (!endTime) { document.getElementById('endTimeError').textContent = 'End time required.'; valid = false; }

  if (startTime && endTime && startTime >= endTime) {
    document.getElementById('endTimeError').textContent = 'End time must be after start time.';
    valid = false;
  }

  if (!location) { document.getElementById('locationError').textContent = 'Location is required.'; valid = false; }
  if (!organization) { document.getElementById('organizationError').textContent = 'Organization is required.'; valid = false; }
  // if (!organizerUserName) { document.getElementById('organizerUserNameError').textContent = 'Organizer username is required.'; valid = false; }

  if (!capacity || isNaN(capacity) || Number(capacity) < 1) {
    document.getElementById('capacityError').textContent = 'Enter valid capacity (at least 1).';
    valid = false;
  }

  if (!ticketType) {
    document.getElementById('ticketTypeError').textContent = 'Please select a ticket type.';
    valid = false;
  } else if (ticketType === 'paid' && (!price || Number(price) <= 0)) {
    document.getElementById('priceError').textContent = 'Please enter a valid ticket price.';
    valid = false;
  }

  if (!valid) return;

  // Prepare data
  const formData = {
    eventName: title,
    organizerUserName: localStorage.getItem("organizerUsername"),
    eventType: category,
    startTime: new Date(`${dateValue}T${startTime}`).toISOString(),
    endTime: new Date(`${dateValue}T${endTime}`).toISOString(),
    location,
    maxParticipants: parseInt(capacity),
    eventPrices: ticketType === 'paid' ? parseInt(price) : 0,
    eventDescription: description,
    Organization: organization
  };

  console.log('Event Created:', formData);

  fetch('http://localhost:3000/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  })
    .then(res => res.json())
    .then(data => {
      alert('Event created successfully!');
      document.getElementById('eventForm').reset();
      togglePriceInput();
    })
    .catch(err => {
      console.error(err);
      alert('Error creating event. Please try again.');
    });
});

function resetForm() {
  if (confirm('Are you sure you want to cancel?')) {
    document.getElementById('eventForm').reset();
    togglePriceInput();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('date').min = new Date().toISOString().split('T')[0];
  togglePriceInput();
});
