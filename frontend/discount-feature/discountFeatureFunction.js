// import { claimTicket } from './event-discovery.js';
async function claimTicket(eventID, eventName) {
    try {
        const studentID = localStorage.getItem('studentID') || localStorage.getItem('StudentID');
        let email = localStorage.getItem('studentEmail') || localStorage.getItem('email');

        if (!studentID) {
            alert('Please log in as a student first.');
            return;
        }

        const attemptClaim = async (mockPaid = false) => {
            const res = await fetch('http://localhost:3000/claim-tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventID, studentID, email, mockPaid })
            });
            let payload = {};
            try { payload = await res.json(); } catch (_) {}
            return { res, payload };
        };

        let { res, payload } = await attemptClaim(false);

        if (res.status === 402) {
            const price = typeof payload.price !== 'undefined' ? payload.price : 'unknown';
            const proceed = confirm(`This event requires payment. Proceed with mock payment of $${price}?`);
            if (!proceed) return;
            ({ res, payload } = await attemptClaim(true));
        }

        if (!res.ok) {
            alert(payload.error || 'Failed to claim ticket.');
            return;
        }

        // Mark as claimed in the current UI
        claimedEventIds.add(String(eventID));
        const btn = document.querySelector(`button.claim-ticket-btn[data-event-id='${eventID}']`);
        if (btn) {
            const label = document.createElement('span');
            label.className = 'claimed-label';
            label.style.display = 'inline-block';
            label.style.padding = '8px 12px';
            label.style.borderRadius = '6px';
            label.style.background = '#eef';
            label.style.color = '#556';
            label.textContent = 'Ticket already claimed';
            btn.replaceWith(label);
        }

        // Expecting: { message, ticketID, qrCode: dataUrl }
        showTicketModal({
            eventName,
            ticketID: payload.ticketID,
            qrCodeDataUrl: payload.qrCode
        });
    } catch (err) {
        console.error('Claim ticket error:', err);
        alert('Network error. Please try again.');
    }
}

async function fetchAndRenderDiscounts(){
    const container = document.getElementById("discounts");
    if (!container) return;

    try{
        const res = await fetch('http://localhost:3000/events/discounts');
        if (!res.ok) throw new Error('Network response was not ok');

        const json = await res.json();
        const events = (json.data || []);

        function getDaysUntil(startIso){
            const diff = new Date(startIso) - new Date();
            return Math.ceil(diff / (1000 * 60 * 60 * 24));
        }

        const lastMinuteEvents = events.filter(e => {
            const days = getDaysUntil(e.startTime);
            return days > 0 && days <= 2;
        });

        if (lastMinuteEvents.length === 0){
            container.innerHTML = "<p>No last-minute discounts available.</p>";
            return;
        }

        container.innerHTML = lastMinuteEvents.map(e => {
            const priceHtml = e.originalPrice > 0
                ? `<div class="price"><s>$${e.originalPrice.toFixed(2)}</s> <strong>$${e.discountedPrice.toFixed(2)}</strong> (${e.discountPercent}% off)</div>`
                : `<div class="price">Free</div>`;

            const capacityHtml = (e.remainingCapacity === null) ? '' : `<div>Remaining: ${e.remainingCapacity}</div>`;

            return `
                <div class="discount-card" data-event-id="${e.eventID}" data-event-name="${escapeHtml(e.eventName)}">
                <h3>${escapeHtml(e.eventName)}</h3>
                <div class="starts-in">Starts in: ${getDaysUntil(e.startTime)}d</div>
                ${priceHtml}
                ${capacityHtml}
                <div class="start-time">${new Date(e.startTime).toLocaleDateString()}</div>
                <button class="claim-btn claim-ticket-btn" data-id="${e.eventID}">Claim / Buy</button>
                </div>
            `;
            }).join('');

            //container.innerHTML = `<h2>Last-minute discounts</h2><div class="discount-grid">${cardsHtml}</div>`;
            
            container.addEventListener('click', (ev) => {
                const btn = ev.target.closest('.claim-btn');
                if (!btn) return;

                const card = btn.closest('.discount-card');
                const eventName = card?.dataset.eventName || 'Unknown Event';
                const eventID = btn.dataset.id;
                // window.location.href = `/events.html?eventID=${eventID}`;
                if (typeof claimTicket === 'function'){
                    claimTicket(eventID, eventName);
                }
                else {
                    console.error('claimTicket function not defined');
                    alert('Claiming tickets is currently unavailable.');
                }
         });
    } catch (err){
        console.error('Error fetching discounts:', err);
        container.innerHTML = "<h2>Last-minute Discounts</h2><p>Error loading discounts.</p>";

    }
}
    function escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, c =>
        ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])
  );
}
fetchAndRenderDiscounts();
