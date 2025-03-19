import { sendTextMessage, sendButtonMessage, sendListMessage } from "../helper/messageHelper.js"
import { searchItem } from "../utils/botHandlerFunctions/searchTerm/searchTerm.js"
import { registerVendor } from "../utils/botHandlerFunctions/vendorTerm/vendorTerm.js"
import Vendor from "../models/Vendor.js";
import User from "../models/user.js";
import Query from "../models/Query.js";




export const handleIncomingMessage = async (req, res) => {
    res.sendStatus(200); // 👈 Send back a 200 response to acknowledge the request

    // console.log("Request Body:", JSON.stringify(req.body, null, 2));

    const messageEntry = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    // console.log("📩 Incoming Message Entry:", messageEntry);

    // // ==> for mult over resp
    // if (!messageEntry || (messageEntry?.from && !messageEntry?.text?.body && !messageEntry.text?.body && !messageEntry.image && !messageEntry?.interactive?.list_reply?.id && !messageEntry?.interactive?.button_reply?.id)) {
    //     console.log("Invalid or empty message received.");
    //     return res.sendStatus(200);
    // }
    const phoneNumber = `+${messageEntry?.from || ""}`;

    const value = req.body?.entry?.[0]?.changes?.[0]?.value; // 👈 Common path extract kar liya
    const contact = value?.contacts?.[0];



    let user = await User.findOne({ phoneNumber });
    let vendor = await Vendor.findOne({ phoneNumber })

    const messageData = {
        vlastMessage: vendor?.lastMessage || "",
        lastMessage: user?.lastMessage || "",
        phoneNumber: `+${messageEntry?.from || ""}`,
        text: messageEntry?.text?.body?.trim().toLowerCase() || "",
        listReply: messageEntry?.interactive?.list_reply?.id?.toLowerCase() || "",
        btnReply: messageEntry?.interactive?.button_reply?.id?.toLowerCase() || "",
        image: {
            mimeType: messageEntry?.image?.mime_type || "",
            sha256: messageEntry?.image?.sha256 || "",
            imageId: messageEntry?.image?.id || ""
        },
        location: {
            latitude: messageEntry?.location?.latitude || null,
            longitude: messageEntry?.location?.longitude || null
        },
        messagingProduct: value?.messaging_product || "",
        profileName: contact?.profile?.name ?? "Unknown User",
        user: user || null,
    };

    console.log("📩 Processed Message PhoneNumber:", messageData.phoneNumber);
    console.log("📩 Processed Message text:", messageData.text);
    console.log("📩 Processed Message image:", messageData.image);
    console.log("📩 Processed Message location:", messageData.location);
    console.log("📩 Processed Message interactiveID BTN:", messageData.btnReply);
    console.log("📩 Processed Message interactiveID LIST:", messageData.listReply);

    let text = messageData.text;
    // let phoneNumber = messageData.phoneNumber;
    if (text === "hi") {
        const languageButtons = [
            { id: "eng", title: "🇬🇧 English" },
            { id: "roman", title: "🇵🇰 Roman Urdu" },
            { id: "urdu", title: "🏴 Urdu" }
        ];
        await sendButtonMessage(phoneNumber, "Hey there! 👋 Welcome! Before we get started, please choose your preferred language. 🌍", languageButtons, "");
    }

    let btnReply = messageData.btnReply;
    if (["eng", "roman", "urdu"].includes(btnReply)) {
        if (user && !vendor) {
            const mainMenuButtons = [
                { id: "search_item", title: "🔍 Search Item" },
                { id: "manage_acc_user", title: "Manage Account" },
                { id: "register_shop", title: "🤝 Register Shop" }
            ];
            await sendButtonMessage(phoneNumber, "✅ Language selected! Please choose an option below:", mainMenuButtons);
        }
        if (vendor && user) {
            const mainMenuButtons = [
                { id: "search_item", title: "🔍 Search Item" },
                { id: "manage_acc_both", title: "Manage Account" }
            ];
            await sendButtonMessage(phoneNumber, "✅ Language selected! Please choose an option below:", mainMenuButtons);
        }
        if (!user && !vendor) {
            const mainMenuButtons = [
                { id: "search_item", title: "🔍 Search Item" },
                { id: "register_shop", title: "🤝 Register Shop" }
            ];
            await sendButtonMessage(phoneNumber, "✅ Language selected! Please choose an option below:", mainMenuButtons);
        }
    }
    // For User and vendor both Manage Account Term
    if (["manage_acc_both"].includes(btnReply)) {
        console.log("manage_acc_user wali condition TRUE");
        const manageAccountButtons = [
            { id: "manage_acc_user", title: "User account" },
            { id: "manage_acc_vendor", title: "Vendor account" },
        ];
        await sendButtonMessage(phoneNumber, "🔧 Select account type:", manageAccountButtons);
    }
    // For User Manage Account Term
    if (["manage_acc_user"].includes(btnReply)) {
        console.log("manage_acc_user wali condition TRUE");
        const manageAccountButtons = [
            { id: "user_overview", title: "Overview" },
            { id: "user_account_update", title: "Account update" },
            { id: "user_history", title: "History" },
        ];
        await sendButtonMessage(phoneNumber, "🔧 Select an option:", manageAccountButtons);
    }
    // For user overview
    if (["user_overview"].includes(btnReply)) {
        console.log("user_overview wali condition TRUE");
        if (user) {
            await sendTextMessage(phoneNumber, `👤 User Overview
            \n👤 Name: ${messageData.profileName}
            \n📱 Phone: ${user.phoneNumber}
            \n💰 Coins: ${user.coins}`);
        }
    }
    // For user history update
    if (["user_history"].includes(String(btnReply))) {
        if (user) {
            // Page number extract karna
            const page = user.historyPage || 1; // Agar pehle set nahi toh default 1
            const limit = 5; // 5 queries per page
            const skip = (page - 1) * limit;
    
            const query = await Query.find({ userId: user._id })
                .sort({ createdAt: -1 })
                .skip(skip) // Pagination ke liye skip karna
                .limit(limit + 1); // 5 se ek zyada query fetch karna taake check ho sake
    
            console.log(query);
    
            if (query.length > 0) {
                // Sirf pehli 5 queries show karni hain
                const displayQueries = query.slice(0, limit);
    
                for (const q of displayQueries) {
                    await sendTextMessage(
                        phoneNumber,
                        `🔍 Search History
                        \n📅 Date: ${q.createdAt}
                        \n🔍 Product: ${q.product}
                        \n💰 Price: ${q.priceByVendor}`
                    );
                }
    
                // Agar aur queries baqi hain, toh "See More" button bhejein
                if (query.length > limit) {
                    const buttons = [
                        { id: "SeeMore", title: "See More" },
                    ];
    
                    await sendButtonMessage(phoneNumber, "🔍 Load more search history?", buttons, "see_more");
                    
                    // User ka historyPage update karein
                    await User.updateOne({ _id: user._id }, { $set: { historyPage: page + 1 } });
                }
            } else {
                await sendTextMessage(phoneNumber, "No search history found");
            }
        } else {
            await sendTextMessage(phoneNumber, "User not found or no search history.");
        }
    }
    // for user account update
    if (["user_account_update"].includes(btnReply)) {
        const accountUpdateButtons = [
            { id: "user_name_update", title: "Update Name" },
            { id: "user_phone_update", title: "Update Phone" },
            { id: "user_email_update", title: "Update Email" },
        ];
        await sendButtonMessage(phoneNumber, "🔧 Select an option:", accountUpdateButtons);
    }
    // for user name update
    if (["user_name_update"].includes(btnReply)) {
        await sendTextMessage(phoneNumber, "Please enter your new name:");
    }
    // for user phone update
    if (["user_phone_update"].includes(btnReply)) {
        await sendTextMessage(phoneNumber, "Please enter your new phone number:");
    }
    // for user email update
    if (["user_email_update"].includes(btnReply)) {
        await sendTextMessage(phoneNumber, "Please enter your new email:");
    }



















    // For User Search Term
    if (["search_item"].includes(btnReply) || user?.lastMessage?.startsWith("0.1") || vendor?.lastMessage?.startsWith("0.1.7_")) {
        console.log("searchItem wali condition TRUE");
        await searchItem(messageData);
        console.log("📩 Updated User Last Message:", user?.lastMessage);
    } 

    // For Reg Shop Term
    if (["register_shop"].includes(btnReply) || (vendor?.lastMessage?.startsWith("0.2"))) {
        console.log("Reg Vendor condition TRUE");
        await registerVendor(messageData);
        console.log("📩 Updated User Last Message:", user?.lastMessage);
    }

}