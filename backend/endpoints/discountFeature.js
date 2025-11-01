const express = require('express');
module.exports = (client) => {
    const router = express.Router();

router.get('/discounts', async (req, res) => {
    try {
        const windowDays = Number(req.query.days) || 2;

        const sql = `
            SELECT "eventID", "eventName", "startTime", "maxParticipants", "currentParticipants", "eventPrices"
            FROM public."Events"
            WHERE "startTime" > NOW()
                AND "startTime" <= NOW() + ($1 || ' days')::interval
                AND ("maxParticipants" IS NULL OR "currentParticipants" < "maxParticipants")
            ORDER BY "startTime" ASC;
            `;

        const result = await client.query(sql, [String(windowDays)]);

        const discounts = result.rows.map(r => {
            const start = new Date(r.startTime);
            const now = new Date();

            const daysUntilStart = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
            let discountPercent = 0;

            if (daysUntilStart <= 1) {
                discountPercent = 50;
            } else if (daysUntilStart <= windowDays) {
                discountPercent = 25;
            }

            const remainingCapacity = (r.maxParticipants == null) ? null : Math.max(0, (r.maxParticipants - (r.currentParticipants || 0)));
            const originalPrice = Number(r.eventPrices) || 0;
            const discountedPrice = Math.round(originalPrice * (100 - discountPercent) / 100 * 100) / 100;

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

        const lastMinuteDiscounts = discounts.filter(d => d.daysUntilStart > 0 && d.daysUntilStart <= windowDays);

        res.status(200).json({message: 'Last-minute discounts', data: lastMinuteDiscounts});
    } catch (error) {
        console.error('Error fetching discounts:', error);
        res.status(500).json({message: 'Database error'});
    }
});
return router;
};
