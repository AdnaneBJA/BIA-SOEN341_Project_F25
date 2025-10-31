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
                <div class="discount-card" data-event-id="${e.eventID}">
                <h3>${escapeHtml(e.eventName)}</h3>
                <div class="starts-in">Starts in: ${getDaysUntil(e.startTime)}d</div>
                ${priceHtml}
                ${capacityHtml}
                <div class="start-time">${new Date(e.startTime).toLocaleDateString()}</div>
                <button class="claim-btn" data-id="${e.eventID}">Claim / Buy</button>
                </div>
            `;
            }).join('');

            //container.innerHTML = `<h2>Last-minute discounts</h2><div class="discount-grid">${cardsHtml}</div>`;
            
            container.addEventListener('click', (ev) => {
                const btn = ev.target.closest('.claim-btn');
                if (!btn) return;
                const eventID = btn.dataset.id;
                window.location.href = `/events.html?eventID=${eventID}`;
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
