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
                priceInput.value = '';
            }
        }

        function handleSubmit(event) {
            event.preventDefault();
            
            const formData = {
                title: document.getElementById('title').value,
                description: document.getElementById('description').value,
                category: document.getElementById('category').value,
                date: document.getElementById('date').value,
                time: document.getElementById('time').value,
                location: document.getElementById('location').value,
                organization: document.getElementById('organization').value,
                capacity: document.getElementById('capacity').value,
                ticketType: document.querySelector('input[name="ticketType"]:checked').value,
                price: document.getElementById('price').value || 0
            };
            
            console.log('Event Created:', formData);
            alert('Event created successfully! Check console for data.');
            
            // Here you would typically send the data to your backend
            // fetch('/api/events', { method: 'POST', body: JSON.stringify(formData) })
        }

        function resetForm() {
            if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
                document.getElementById('eventForm').reset();
                togglePriceInput();
            }
        }

        // Set minimum date to today
        document.getElementById('date').min = new Date().toISOString().split('T')[0];