const express = require('express');
module.exports = (client) => {
    const router = express.Router();

router.get('/discounts', async (req, res) => {
    try {
        const sql = `
            SELECT "eventID", "eventName", "startTime", "maxParticipants", "currentParticipants", "eventPrices", 
                   "lastMinuteDiscountEnabled", "discountPercentage", "discountTimeWindowHours"
            FROM public."Events"
            WHERE "startTime" > NOW()
                AND ("maxParticipants" IS NULL OR "currentParticipants" < "maxParticipants")
                AND "lastMinuteDiscountEnabled" = TRUE
            ORDER BY "startTime" ASC;
            `;

        const result = await client.query(sql);

        const discounts = result.rows.map(r => {
            const start = new Date(r.startTime);
            const now = new Date();
            
            // Calculate hours until start
            const hoursUntilStart = (start - now) / (1000 * 60 * 60);
            const daysUntilStart = Math.ceil(hoursUntilStart / 24);
            
            let discountPercent = 0;
            
            // Use custom discount settings if provided, otherwise fall back to legacy hardcoded logic
            if (r.discountPercentage !== null && r.discountPercentage !== undefined && 
                r.discountTimeWindowHours !== null && r.discountTimeWindowHours !== undefined) {
                // Custom discount settings
                const customDiscountPercent = r.discountPercentage;
                const customTimeWindowHours = r.discountTimeWindowHours;
                
                // Check if within the custom time window
                if (hoursUntilStart > 0 && hoursUntilStart <= customTimeWindowHours) {
                    discountPercent = customDiscountPercent;
                }
            } else {
                // Legacy hardcoded logic for backward compatibility (used by tests)
                if (daysUntilStart <= 1) {
                    discountPercent = 50;
                } else if (daysUntilStart <= 2) {
                    discountPercent = 25;
                }
            }

            const remainingCapacity = (r.maxParticipants == null) ? null : Math.max(0, (r.maxParticipants - (r.currentParticipants || 0)));
            const originalPrice = Number(r.eventPrices) || 0;
            const discountedPrice = discountPercent > 0 
                ? Math.round(originalPrice * (100 - discountPercent) / 100 * 100) / 100 
                : originalPrice;

            return {
                eventID: r.eventID,
                eventName: r.eventName,
                startTime: r.startTime,
                daysUntilStart,
                remainingCapacity,
                originalPrice,
                discountPercent,
                discountedPrice
            };
        });

        // Filter to only include events with active discounts
        const lastMinuteDiscounts = discounts.filter(d => d.discountPercent > 0);

        res.status(200).json({message: 'Last-minute discounts', data: lastMinuteDiscounts});
    } catch (error) {
        console.error('Error fetching discounts:', error);
        res.status(500).json({message: 'Database error'});
    }
});
return router;
};
