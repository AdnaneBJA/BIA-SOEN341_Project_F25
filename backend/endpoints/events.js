const express = require("express");

module.exports = (client) => {
    const router = express.Router();
    router.get("/", async (req, res) => {
        try {
            const sql = `SELECT * FROM public."Events";`;
            const result = await client.query(sql);

            // Calculate discounted prices for events with discounts enabled
            const now = new Date();
            const eventsWithDiscounts = result.rows.map(event => {
                const eventData = { ...event };
                const originalPrice = Number(event.eventPrices) || 0;
                
                // Only calculate discount if enabled and event is in the future
                if (event.lastMinuteDiscountEnabled && originalPrice > 0 && event.startTime) {
                    const eventStart = new Date(event.startTime);
                    const hoursUntilStart = (eventStart - now) / (1000 * 60 * 60);
                    
                    let discountPercent = 0;
                    let hasDiscount = false;
                    
                    // Use custom discount settings if provided, otherwise use legacy logic
                    if (event.discountPercentage !== null && event.discountPercentage !== undefined && 
                        event.discountTimeWindowHours !== null && event.discountTimeWindowHours !== undefined) {
                        // Custom discount settings
                        const customDiscountPercent = event.discountPercentage;
                        const customTimeWindowHours = event.discountTimeWindowHours;
                        
                        // Check if within the custom time window (in hours)
                        if (hoursUntilStart > 0 && hoursUntilStart <= customTimeWindowHours) {
                            discountPercent = customDiscountPercent;
                            hasDiscount = true;
                        }
                    } else {
                        // Legacy hardcoded logic for backward compatibility
                        const daysUntilStart = Math.ceil(hoursUntilStart / 24);
                        if (hoursUntilStart > 0 && hoursUntilStart <= 48) { // 2 days = 48 hours
                            if (daysUntilStart <= 1) {
                                discountPercent = 50;
                                hasDiscount = true;
                            } else if (daysUntilStart <= 2) {
                                discountPercent = 25;
                                hasDiscount = true;
                            }
                        }
                    }
                    
                    if (hasDiscount) {
                        eventData.originalPrice = originalPrice;
                        eventData.discountedPrice = Math.round(originalPrice * (100 - discountPercent) / 100 * 100) / 100;
                        eventData.discountPercent = discountPercent;
                        eventData.hasDiscount = true;
                    } else {
                        eventData.originalPrice = originalPrice;
                        eventData.discountedPrice = originalPrice;
                        eventData.hasDiscount = false;
                    }
                } else {
                    eventData.originalPrice = originalPrice;
                    eventData.discountedPrice = originalPrice;
                    eventData.hasDiscount = false;
                }
                
                return eventData;
            });

            res.status(200).json({
                message: "Retrieving all events",
                data: eventsWithDiscounts,
            });
        } catch (error) {
            console.error("Database error:", error);
            res.status(500).json({ error: "Database error" });
        }
    });

    router.get("/organizations", async (req, res) => {
        try {
            const sql = `SELECT DISTINCT "Organization" FROM public."Events" WHERE "Organization" IS NOT NULL AND trim("Organization") <> '' ORDER BY "Organization" ASC;`;
            const result = await client.query(sql);
            const organizations = result.rows.map(r => r.Organization);
            res.status(200).json({
                message: "Retrieving all organizations",
                data: organizations,
            });
        } catch (error) {
            console.error("Database error:", error);
            res.status(500).json({ error: "Database error" });
        }
    });

    router.post("/", async (req, res) => {
        const {
            eventName,
            eventType,
            startTime,
            endTime,
            location,
            maxParticipants,
            eventPrices,
            eventDescription,
            organizerUserName,
            Organization,
            lastMinuteDiscountEnabled,
            discountPercentage,
            discountTimeWindowHours
        } = req.body;

        if (
            !eventName ||
            !startTime ||
            !endTime ||
            maxParticipants === null ||
            eventPrices === null ||
            !Organization ||
            !organizerUserName ||
            !location
        ) {
            return res.status(400).json({
                error: "Required fields: eventName, startTime, endTime, location, maxParticipants, eventPrices, Organization Name, organizerUserName",
            });
        }

        // Validate discount settings if enabled
        const discountEnabled = lastMinuteDiscountEnabled === true;
        if (discountEnabled) {
            const discountPercentNum = Number(discountPercentage);
            const timeWindowNum = Number(discountTimeWindowHours);

            if (discountPercentage === null || discountPercentage === undefined || isNaN(discountPercentNum)) {
                return res.status(400).json({
                    error: "Discount percentage is required when last-minute discounts are enabled."
                });
            }

            if (discountPercentNum < 5 || discountPercentNum > 50) {
                return res.status(400).json({
                    error: "Discount percentage must be between 5% and 50%."
                });
            }

            if (discountTimeWindowHours === null || discountTimeWindowHours === undefined || isNaN(timeWindowNum)) {
                return res.status(400).json({
                    error: "Time window is required when last-minute discounts are enabled."
                });
            }

            if (timeWindowNum < 12 || timeWindowNum > 72) {
                return res.status(400).json({
                    error: "Time window must be between 12 and 72 hours."
                });
            }
        }

        try {
            //first get the organizerID by using organizerUserName
            const organizerLookupSql = `
                SELECT "organizerID" FROM public."Organizer" 
                WHERE "organizerUserName" = $1; 
            `;
            const organizerResult = await client.query(organizerLookupSql, [organizerUserName]);

            if (organizerResult.rows.length === 0) {
                return res.status(404).json({
                    error: "Organizer not found"
                });
            }

            const organizerID = organizerResult.rows[0].organizerID;
            // now insert event into table with organizerID and organizerUserName
            const sql = `
                INSERT INTO public."Events" (
                    "eventName",  
                    "organizerID", 
                    "eventType", 
                    "startTime", 
                    "endTime", 
                    "location", 
                    "maxParticipants", 
                    "eventPrices",
                    "eventDescription",
                    "organizerUserName", 
                    "Organization",
                    "lastMinuteDiscountEnabled",
                    "discountPercentage",
                    "discountTimeWindowHours"
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING *;
            `;

            // Default to false if not provided (per requirements: default state disabled)
            const discountEnabled = lastMinuteDiscountEnabled === true;
            const discountPercent = discountEnabled ? parseInt(discountPercentage) : null;
            const timeWindow = discountEnabled ? parseInt(discountTimeWindowHours) : null;

            const values = [
                eventName,
                organizerID,
                eventType,
                startTime,
                endTime,
                location,
                maxParticipants,
                eventPrices,
                eventDescription,
                organizerUserName,
                Organization,
                discountEnabled,
                discountPercent,
                timeWindow
            ];

            const result = await client.query(sql, values);

            res.status(201).json({
                message: "Event created successfully!",
                data: result.rows[0],
            });
        } catch (error) {
            console.error("Database error:", error);
            res.status(500).json({ error: "Database error" });
        }
    });

    router.get("/total", async (req, res) => {
        //add validation for admin: If (adminID) ... else error
        try {
            const sql = 'SELECT COUNT(*) AS count FROM public."Events"';
            const result = await client.query(sql);

            res.status(200).json({
                message: "Retrieving total number of events",
                data: Number(result.rows[0].count)
            });
        } catch (error) {
            console.error("Database error:", error);
            res.status(500).json({ error: "Database error" });
        }
    });
    // Update event (PUT endpoint for editing events)
    router.put("/:eventID", async (req, res) => {
        const { eventID } = req.params;
        const {
            eventName,
            eventType,
            startTime,
            endTime,
            location,
            maxParticipants,
            eventPrices,
            eventDescription,
            Organization,
            organizerUserName,
            lastMinuteDiscountEnabled,
            discountPercentage,
            discountTimeWindowHours
        } = req.body;

        if (!eventID) {
            return res.status(400).json({
                error: "Event ID is required"
            });
        }

        if (!organizerUserName) {
            return res.status(400).json({
                error: "organizerUserName is required for authorization"
            });
        }

        try {
            // First verify the event exists and get the organizer info
            const eventCheckSql = `
                SELECT "organizerID", "organizerUserName" 
                FROM public."Events" 
                WHERE "eventID" = $1;
            `;
            const eventCheckResult = await client.query(eventCheckSql, [eventID]);

            if (eventCheckResult.rows.length === 0) {
                return res.status(404).json({
                    error: "Event not found"
                });
            }

            // Authorization check: only the event organizer can edit
            const eventOrganizer = eventCheckResult.rows[0].organizerusername || eventCheckResult.rows[0].organizerUserName;
            if (String(eventOrganizer) !== String(organizerUserName)) {
                return res.status(403).json({
                    error: "Unauthorized: Only the event organizer can edit this event"
                });
            }

            // Validate discount settings if enabled
            const discountEnabled = lastMinuteDiscountEnabled === true;
            if (discountEnabled) {
                const discountPercentNum = Number(discountPercentage);
                const timeWindowNum = Number(discountTimeWindowHours);

                if (discountPercentage === null || discountPercentage === undefined || isNaN(discountPercentNum)) {
                    return res.status(400).json({
                        error: "Discount percentage is required when last-minute discounts are enabled."
                    });
                }

                if (discountPercentNum < 5 || discountPercentNum > 50) {
                    return res.status(400).json({
                        error: "Discount percentage must be between 5% and 50%."
                    });
                }

                if (discountTimeWindowHours === null || discountTimeWindowHours === undefined || isNaN(timeWindowNum)) {
                    return res.status(400).json({
                        error: "Time window is required when last-minute discounts are enabled."
                    });
                }

                if (timeWindowNum < 12 || timeWindowNum > 72) {
                    return res.status(400).json({
                        error: "Time window must be between 12 and 72 hours."
                    });
                }
            }

            // Build update query dynamically based on provided fields
            const updateFields = [];
            const updateValues = [];
            let paramIndex = 1;

            if (eventName !== undefined) {
                updateFields.push(`"eventName" = $${paramIndex++}`);
                updateValues.push(eventName);
            }
            if (eventType !== undefined) {
                updateFields.push(`"eventType" = $${paramIndex++}`);
                updateValues.push(eventType);
            }
            if (startTime !== undefined) {
                updateFields.push(`"startTime" = $${paramIndex++}`);
                updateValues.push(startTime);
            }
            if (endTime !== undefined) {
                updateFields.push(`"endTime" = $${paramIndex++}`);
                updateValues.push(endTime);
            }
            if (location !== undefined) {
                updateFields.push(`"location" = $${paramIndex++}`);
                updateValues.push(location);
            }
            if (maxParticipants !== undefined) {
                updateFields.push(`"maxParticipants" = $${paramIndex++}`);
                updateValues.push(maxParticipants);
            }
            if (eventPrices !== undefined) {
                updateFields.push(`"eventPrices" = $${paramIndex++}`);
                updateValues.push(eventPrices);
            }
            if (eventDescription !== undefined) {
                updateFields.push(`"eventDescription" = $${paramIndex++}`);
                updateValues.push(eventDescription);
            }
            if (Organization !== undefined) {
                updateFields.push(`"Organization" = $${paramIndex++}`);
                updateValues.push(Organization);
            }

            // Always update discount settings if provided
            updateFields.push(`"lastMinuteDiscountEnabled" = $${paramIndex++}`);
            updateValues.push(discountEnabled);
            
            const discountPercent = discountEnabled ? parseInt(discountPercentage) : null;
            const timeWindow = discountEnabled ? parseInt(discountTimeWindowHours) : null;
            
            updateFields.push(`"discountPercentage" = $${paramIndex++}`);
            updateValues.push(discountPercent);
            
            updateFields.push(`"discountTimeWindowHours" = $${paramIndex++}`);
            updateValues.push(timeWindow);

            if (updateFields.length === 0) {
                return res.status(400).json({
                    error: "No fields to update"
                });
            }

            updateValues.push(eventID);
            const updateSql = `
                UPDATE public."Events"
                SET ${updateFields.join(', ')}
                WHERE "eventID" = $${paramIndex}
                RETURNING *;
            `;

            const result = await client.query(updateSql, updateValues);

            res.status(200).json({
                message: "Event updated successfully!",
                data: result.rows[0]
            });
        } catch (error) {
            console.error("Database error:", error);
            res.status(500).json({ error: "Database error" });
        }
    });

    router.delete("/:eventID", async (req, res) => {
        const { eventID } = req.params;

        if (!eventID) {
            return res.status(400).json({
                error: "Event ID is required"
            });
        }

        try {
            const deleteTicketsSql = `
                DELETE FROM public."Ticket"
                WHERE "eventID" = $1;
            `;
            await client.query(deleteTicketsSql, [eventID]);

            const deleteEventSql = `
                DELETE FROM public."Events"
                WHERE "eventID" = $1
                RETURNING *;
            `;
            const result = await client.query(deleteEventSql, [eventID]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: "Event not found"
                });
            }

            res.status(200).json({
                message: "Event and associated tickets deleted successfully",
                data: result.rows[0]
            });
        } catch (error) {
            console.error("Database error:", error);
            res.status(500).json({ error: "Database error while deleting event" });
        }
    });

    return router;
};