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
            
            // Use custom discount settings from database
            const customDiscountPercent = r.discountPercentage || 25;
            const customTimeWindowHours = r.discountTimeWindowHours || 48;
            
            let discountPercent = 0;
            
            // Check if within the custom time window
            if (hoursUntilStart > 0 && hoursUntilStart <= customTimeWindowHours) {
                discountPercent = customDiscountPercent;
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
