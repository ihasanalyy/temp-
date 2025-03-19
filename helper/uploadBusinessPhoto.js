import axios from "axios";
import streamifier from "streamifier";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config(); // 🔹 Load Environment Variables

// ✅ Direct Cloudinary Configuration
cloudinary.config({
    cloud_name: 'dpsxv4fmn',
    api_key: '674392325678217',
    api_secret: '6KhvEX2F0eULk-1VKcGB3eysv6c',
    timeout: 60000,// 🔹 60 seconds timeout (optional)
});

export const uploadBusinessPhoto = async (phoneNumber, imageId) => {
    try {
        console.log("📩 Uploading Business Photo for:", phoneNumber, "Image ID:", imageId);

        // 1️⃣ **WhatsApp se Image URL lo**
        const mediaResponse = await axios.get(`https://graph.facebook.com/v22.0/${imageId}`, {
            headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
        });

        const imageUrl = mediaResponse.data.url;
        if (!imageUrl) throw new Error("❌ Image URL not found!");

        console.log("✅ Image URL:", imageUrl);

        // 2️⃣ **WhatsApp Image Buffer Download Karo**
        const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });

        if (!imageResponse.data || imageResponse.data.length < 1000) {
            throw new Error("❌ Invalid Image Data! Buffer too small.");
        }

        const buffer = Buffer.from(imageResponse.data);
        console.log("✅ Image Converted to Buffer");

        // 3️⃣ **Alternative Base64 Upload**
        const base64Image = `data:image/jpeg;base64,${buffer.toString("base64")}`;

        // 4️⃣ **Cloudinary Pe Upload Karo**
        console.log("🔄 Uploading to Cloudinary...");
        const uploadedImage = await cloudinary.uploader.upload(base64Image, {
            folder: "whatsapp_business_photos",
            public_id: `business_${phoneNumber}_${Date.now()}`,
        });

        console.log("✅ Image uploaded to Cloudinary:", uploadedImage.secure_url);

        return uploadedImage.secure_url;
    } catch (error) {
        console.error("❌ Upload Error:", error.response?.data || error.message);
        return null;
    }
};