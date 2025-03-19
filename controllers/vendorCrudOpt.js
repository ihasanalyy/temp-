import Vendor from "../models/Vendor.js";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import { getLocationDetails } from "../utils/geolocation/geoLocation.js";

// deleteVendor function to delete a vendor shop
export const deleteVendor = async (req, res) => {
    try {
        const deletedVendor = await Vendor.findByIdAndDelete(req.user.id);
        if (!deletedVendor) return res.status(404).json({ message: "Vendor not found" });
        res.json({ message: "Vendor shop deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting vendor shop" });
    }
}
// updateVendor function to update a vendor shop
export const updateVendor = async (req, res) => {
    try {
        const updatedVendor = await Vendor.findByIdAndUpdate(req.user.id, req.body, { new: true });
        if (!updatedVendor) return res.status(404).json({ message: "Vendor not found" });
        res.json(updatedVendor);
    } catch (error) {
        res.status(500).json({ message: "Error updating vendor shop" });
    }
}
// vendor history
export const getHistoryVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.user.id, "responseHistory");
        if (!vendor) return res.status(404).json({ message: "Vendor not found" });
        res.json({ responseHistory: vendor.responseHistory });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving vendor response history" });
    }
}
// vendor login
export const vendorLogin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    } else {
        try {
            const existingVendor = await Vendor.findOne({ email });
            if (!existingVendor || !(await bcrypt.compare(password, existingVendor.password))) {
                return res.status(401).json({ message: "Invalid credentials" });
            } else if (existingVendor && (await bcrypt.compare(password, existingVendor.password))) {
                const token = jwt.sign({ id: existingVendor._id }, process.env.SECRET_KEY, { expiresIn: "1h" });
                res.cookie("access_token", token, { httpOnly: true, secure: true, sameSite: "strict" });
                res.status(200).json({ message: "Login successful" });
            }
        } catch (error) {
            return res.status(400).json({ error: "Error logging in", error });
        }
    }
}
// vendor sign up
export const vendorSignUp = async (req, res) => {
    const { email, password, phoneNumber, address, shopName, shopCategory, pinLocation, products } = req.body;
    console.log(req.body);
    if (!email || !password || !phoneNumber || !address || !shopName || !shopCategory || !pinLocation) {
        return res.status(400).json({ message: "All fileds are required" });
    }
    try {
        const existingVendor = await Vendor.findOne({ email });
        if (existingVendor) {
            return res.status(400).json({ message: "Vendor already exists" });
        } else {
            const hashPassword = await bcrypt.hash(password, 10);
            const lng = pinLocation.coordinates[0]; // Extract latitude first
            const lat = pinLocation.coordinates[1]; // Extract longitude second
            const locationData = await getLocationDetails(lat, lng);
            const newVendor = await Vendor.create({
                email,
                password: hashPassword,
                phoneNumber,
                address,
                shopName,
                shopCategory,
                products,
                pinLocation: {
                    type: "Point",
                    coordinates: [lng, lat]
                },
                country: locationData.country,
                city: locationData.city,
                postalCode: locationData.postalCode
            })
            await newVendor.save();
            return res.status(201).json({ message: "Vendor created successfully" });
        }
    } catch (error) {
        res.status(400).json({ error: "Error creating vendor", details: error.message });
    }
}