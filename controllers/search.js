import Query from "../models/Query.js";
import vendor from "../models/Vendor.js";
import User from "../models/user.js";
import mongoose from "mongoose";
import { sendButtonMessage } from "../helper/messageHelperForVendor.js";
// import { query } from "express";

export const search = async (req, res) => {
    const { query, latitude, longitude, radius, searchCategory } = req.body;
    console.log("Received Search Request:", { query, latitude, longitude, radius, searchCategory });

    const userId = req.user.id;
    if (!query) return res.status(400).json({ message: "Search query is required" });

    try {
        let searchCriteria = { shopCategory: { $regex: searchCategory, $options: "i" } };

        //  **Location-based filtering (if provided)**
        if (latitude && longitude && radius) {
            searchCriteria.pinLocation = {
                $near: {
                    $geometry: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] },
                    $maxDistance: parseFloat(radius) * 1000, // Convert km to meters
                },
            };
        }

        // 🔎 **Find Vendors Based on Search Criteria**
        const vendors = await vendor.find(searchCriteria, "shopName shopCategory shopImg phoneNumber");

        console.log(`Found ${vendors.length} vendors for search query: "${query}"`);

        if (vendors.length === 0) {
            return res.status(404).json({ message: "No vendors found for this query" });
        }

        // 👤 **Fetch User Once**
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // 📜 **Update Search History If New**
        const alreadySearched = user.searchHistory.some(item => item.query.toLowerCase() === query.toLowerCase());
        if (!alreadySearched) {
            user.searchHistory.push({ query });
            await user.save();
        }

        // 🛒 **Process Vendors and Send Messages**
        const queryPromises = vendors.map(async (vendor) => {
            if (!vendor.phoneNumber) {
                console.error(`❌ Vendor ${vendor._id} has no phone number!`);
                return null;
            }

            const queryId = new Date().getTime().toString(); // Unique Query ID
            console.log(`Generated Query ID ${queryId} for Vendor ${vendor.shopName}`);

            const newQuery = await Query.create({
                queryId: queryId,
                userId: userId,
                vendorId: vendor._id,
                product: query,
                status: "waiting",
            });

            const button = [
                { id: `Yes_avl|${queryId}`, title: "Yes" },
                { id: "No_avl", title: "No" }
            ];

            try {
                await sendButtonMessage(
                    vendor.phoneNumber,
                    `User is searching for ${query}. Do you have it available?`,
                    button,
                    `0.1.7_${queryId}`
                );
                console.log(`✅ Message sent to Vendor: ${vendor.shopName}`);
            } catch (error) {
                console.error(`❌ Error sending message to Vendor ${vendor.shopName}:`, error);
            }

            return {
                shopName: vendor.shopName,
                shopCategory: vendor.shopCategory,
                shopImg: vendor.shopImg,
                queryId: newQuery.queryId,
            };
        });

        // 🕒 **Wait for All Queries & Messages to Complete**
        const vendorResults = await Promise.all(queryPromises);

        // ✅ **Return Vendor List**
        return res.json(vendorResults.filter(v => v !== null));

    } catch (error) {
        console.error("🚨 Search Error:", error);
        return res.status(500).json({ message: "Error searching vendors", error: error.message });
    }
};

export const openShop = async (req, res) => {
    const userId = req.user.id;
    const { queryId } = req.params;
    console.log(userId, "user agaya", queryId, "query aa gaya");

    try {
        const userFound = await User.findById(userId);
        const query = await Query.findOne({ queryId });

        if (!userFound) return res.status(404).json({ message: "User not found" });
        if (!query) return res.status(404).json({ message: "Query not found" });

        const vendorId = query.vendorId;
        const vendorFound = await vendor.findById(vendorId);
        if (!vendorFound) return res.status(404).json({ message: "Vendor not found" });

       

        if (!query.detailsViewed) {
            query.detailsViewed = true;
            await query.save();
            if (userFound.coins < 1) {
                return res.status(400).json({ message: "Insufficient coins" });
            }
            userFound.coins -= 1;
            await userFound.save();
        }

        await vendor.findByIdAndUpdate(vendorId, {
            $push: { responseHistory: { userId, action: "User viewed shop" } }
        }, { new: true });

        res.json({
            shopName: vendorFound.shopName,
            shopCategory: vendorFound.shopCategory,
            shopImg: vendorFound.shopImg
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving vendor details" });
    }
};

export const openShopDetails = async (req, res) => {
    const userId = req.user.id;
    const { queryId } = req.params;
    console.log(userId, queryId)

    try {
        const userFound = await User.findById(userId);
        if (!userFound) return res.status(404).json({ message: "User not found" });
        else {
            const queryFound = await Query.findOne({ queryId });
            if (!queryFound.contactViewed) {
                queryFound.contactViewed = true;
                await queryFound.save();
                if (userFound.coins < 1) {
                    return res.status(400).json({ message: "Insufficient coins" });
                }
                userFound.coins -= 1;
                await userFound.save();
            }
            console.log(queryFound.vendorId, "queryFound")
            const vendorId = queryFound.vendorId;
            const vendorFound = await vendor.findOne({ _id: new mongoose.Types.ObjectId(vendorId) });
            console.log(vendorFound.vendorId, "vendorFound")
            if (!vendorFound) return res.status(404).json({ message: "Vendor not found" });
            res.json({ phoneNumber: vendorFound?.phoneNumber, email: vendorFound?.email, address: vendorFound?.address });
        }
    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ message: "Error searching vendors", error: error.message });
    }
}

export const openPriceDetails = async (req, res) => {
    const userId = req.user.id;
    const { queryId } = req.params;
    console.log(userId, queryId)

    try {
        const userFound = await User.findById(userId);
        if (!userFound) return res.status(404).json({ message: "User not found" });
        else {
            const queryFound = await Query.findOne({ queryId });
            if (!queryFound.priceViewed) {
                queryFound.priceViewed = true;
                await queryFound.save();
                if (userFound.coins < 1) {
                    return res.status(400).json({ message: "Insufficient coins" });
                }
                userFound.coins -= 1;
                await userFound.save();
            }
            // const vendorFound = await vendor.findById(vendorId);
            console.log(queryFound, "query")
            if (!queryFound) return res.status(404).json({ message: "Query not found" });
            res.json({product: queryFound?.product, price: queryFound?.priceByVendor});
        }
    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ message: "Error searching vendors", error: error.message });
    }
}