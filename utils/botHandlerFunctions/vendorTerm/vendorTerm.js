import { sendButtonMessage, sendListMessage, sendPhotoMessage, sendTextMessage } from "../../../helper/messageHelperForVendor.js";
import { uploadBusinessPhoto } from "../../../helper/uploadBusinessPhoto.js";
import Vendor from "../../../models/Vendor.js";
// import { shopCategory } from "../constants/shopCategory";

const shopCategory = [
    { id: 1, title: "Grocery" },
    { id: 2, title: "Clothing" },
    { id: 3, title: "Electronics" },
    { id: 4, title: "Salon & Beauty" },
    { id: 5, title: "Food & Beverages" }
];


export const registerVendor = async (messageData) => {

    const {
        phoneNumber,
        text,
        btnReply,
        listReply,
        lastMessage,
        image = {},
        location,
        messagingProduct,
        profileName,
        user,
        vlastMessage
    } = messageData;

    const { longitude, latitude } = location;
    const { imageId, sha256, mimeType } = image;

    console.log("registerVendor")


    let vendor = await Vendor.findOne({ phoneNumber });


    if (btnReply?.toLowerCase() === "register_shop" || vlastMessage === "0.2.0") {
            await sendTextMessage(phoneNumber, "✅ Great! Thanks for confirming. Now, let’s get you registered as a vendor. This will just take a few minutes. ⏳", "0.2.1");
            await sendTextMessage(phoneNumber, " 📝 First, please share your full name.", "0.2.1");
    }


    else if (text && vendor?.lastMessage === "0.2.1") {
        console.log("vendor ke naam ke ander", text)

        const isValidName = (text) => /^[A-Za-z\s]+$/.test(text);
        console.log("isValidName", isValidName(text))
        
        if (!isValidName(text)) {
            await sendTextMessage(phoneNumber, "❌ Invalid name! Please enter a valid name with alphabets only.", "0.2.1");
            return;
        }

        vendor.vendorFullName = text;
        await vendor.save();
        await sendTextMessage(phoneNumber, " ✅ Got it! Now, what’s the name of your shop? 🏪", "0.2.2")

    }


    else if (text && vlastMessage === "0.2.2") {

        const isValidShopName = (text) => /^[A-Za-z0-9\s]+$/.test(text);
        console.log("isValidName", isValidShopName(text))
        if (!isValidShopName(text)) {
            await sendTextMessage(phoneNumber, "❌ Invalid shop name! Please enter a valid name with alphabets and numbers only.", "0.2.2");
            return;
        }

        vendor.shopName = text;
        await vendor.save();
        await sendTextMessage(phoneNumber, "Please enter your shop's complete address (e.g., Street name, Area, City).", "0.2.3");
    }


    else if (text && vlastMessage === "0.2.3") {

        const isValidAddress = (address) => /^[A-Za-z0-9\s,.-/#]+$/.test(address);

        if (!isValidAddress(text)) {
            await sendTextMessage(phoneNumber, "Invalid address! Please enter a valid address (e.g., Street name, Area, City).", "0.2.3");
            return;
        }

        vendor.address = text;
        await vendor.save()
        await sendTextMessage(phoneNumber, "Great! Now, please share your shop's exact location by sending a pinned location.", "0.2.4")
    }

 
    else if (vendor?.lastMessage === "0.2.4") {

        if (!location?.latitude || !location?.longitude) {
            console.log("Location not received!");
            await sendTextMessage(phoneNumber, "Invalid location! Please share your live location again.", "0.2.4");
            return;
        }
        vendor.pinLocation.coordinates[0] = longitude;
        vendor.pinLocation.coordinates[1] = latitude;
        await vendor.save()
        await sendTextMessage(phoneNumber, "📸 Thanks! Now, send a clear photo of your shop.", "0.2.5")
    }


    else if (imageId && vlastMessage === "0.2.5") {
        // 📸 WhatsApp se image ID lo
        const image = imageId
        console.log("imageeee id", image)
        if (image) {
            const imageUrl = await uploadBusinessPhoto(phoneNumber, image); // 🔹 Cloudinary pe upload karo
            console.log("image_URL imageeee id k baad", imageUrl)
            if (imageUrl) {
                // ✅ WhatsApp pe confirmatory message send karo
                console.log("if ky andar imageURL")
                await sendPhotoMessage(phoneNumber, imageUrl, "✅ Your business photo has been uploaded successfully! 📸");
                // 📩 Database me shop image save karo
                vendor.shopImg = imageUrl;
                await vendor.save();
            } else {
                await sendTextMessage(phoneNumber, "❌ Failed to upload your business photo. Please try again.");
            }
        } else {
            await sendTextMessage(phoneNumber, "❌ No image found! Please send a valid business photo.");
        }
        const categories = shopCategory.map((category) => `${category.id}. ${category.title}`).join("\n");

        const message = `Great! Now, please select the category that best describes your shop.\n\n` +
            `${categories}\n\n` +
            `Choose the categories that best describe your shop. You can select multiple options by sending the numbers separated by commas (e.g., 2,4,3).`;

        await sendTextMessage(phoneNumber, message, "0.2.6");
    }


    else if (text && vlastMessage === "0.2.6") {

        const idList = shopCategory.map((category) => category.id); 
        const isValidNumAndComma = (input) => /^[0-9,\s]+$/.test(input);

        if (!isValidNumAndComma(text)) {
            await sendTextMessage(phoneNumber, "❌ Invalid input! Please enter only category numbers separated by commas (e.g., 2,4,3).", "0.2.6");
            return;
        }

        const selectedIds = text.split(",").map(num => Number(num.trim())).filter(num => !isNaN(num));

        if (selectedIds.length === 0 || !selectedIds.every(num => idList.includes(num))) {
            await sendTextMessage(phoneNumber, "❌ Invalid category number! Please select from the given options (e.g., 2,4,3).", "0.2.6");
            return;
        }

        const categories = text.split(",").map(num => Number(num.trim())).filter(num => !isNaN(num)); //===> agr number nh tou karwado
        console.log("categories", categories)

        const selectedCategories = categories.map(category => shopCategory[category - 1].title);
        console.log("selectedCategories", selectedCategories)
        vendor.shopCategory = selectedCategories;
        await vendor.save()

        const showcategory = vendor?.shopCategory.map((category, index) => `${index + 1}. ${category}`);
        const buttons = [{ id: "Confirm", title: "Confirm" }, { id: "Re_Select", title: "Re-Select" }];
        const message = `You Selected below categories\n` +
            `${showcategory.join("\n")}`;
        await sendButtonMessage(phoneNumber, message, buttons, "0.2.7");
    }


    else if (vlastMessage === "0.2.7" && btnReply?.toLowerCase() === "re_select") {

        const categories = shopCategory.map((category) => `${category.id}. ${category.title}`).join("\n");

        const message = `Please Re-select the category that best describes your shop.\n\n` +
            `${categories}\n\n` +
            `Choose the categories that best describe your shop. You can select multiple options by sending the numbers separated by commas (e.g., 2,4,3).`;

        await sendTextMessage(phoneNumber, message, "0.2.6"); 
    }


    else if (vlastMessage === "0.2.7" && btnReply?.toLowerCase() === "confirm") {
        await vendor.save()
        await sendTextMessage(phoneNumber, "Great! Your shop has been successfully registered.\n", "0.2.8");
    }
}
