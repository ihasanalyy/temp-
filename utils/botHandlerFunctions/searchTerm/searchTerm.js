import { sendButtonMessage, sendListMessage, sendTextMessage } from "../../../helper/messageHelper.js";
import User from "../../../models/user.js";
import Vendor from "../../../models/Vendor.js";
import Query from "../../../models/Query.js";
const { ObjectId } = mongoose.Types;
import mongoose from "mongoose";

const categories = [
    { id: "grocery", title: "🛒 Grocery" },
    { id: "clothing", title: "👗👕 Clothing" },
    { id: "electronics", title: "📱💻 Electronics" },
    { id: "salon_beauty", title: "💇‍♂️💅 Salon & Beauty" },
    { id: "food_beverages", title: "🍔☕ Food & Beverages" }
];



export const searchItem = async (messageData) => {
    const { phoneNumber, text, btnReply, listReply, lastMessage, image = {}, location, messagingProduct, profileName, user } = messageData;
    if (btnReply === "search_item") {
        console.log("what do you want to search")
        await sendTextMessage(phoneNumber, "✅ Great! Thanks for confirming. Now, tell me—what are you looking for today? 🔎", "0.1.1");
    }

    else if (text && user.lastMessage === "0.1.1") {
        const user = await User.findOne({ phoneNumber })
        const Product = text;
        user.currentSearch = Product;
        // user.searchHistory.push({ query: text });
        const queryId = new Date().getTime(); // Unique ID for each query

        const existingQuery = await Query.findOne({
              vendorId:null,
              userId: user._id,
              product: Product,
              status: "waiting"
          });
          if (existingQuery) {
              console.log(`Skipping duplicate query for Vendor ${user._id} - Product: ${Product}`);
              return { userId: user._id, pendingQueries: [existingQuery] }; // Sirf existing query return karo
          }
          const newQuery = {
              queryId,
              userId: user._id,
              vendorId: null, // Send vendor ID one by one
              product : Product,
              status: "waiting"
          };

          //  Query create karna
          await Query.create(newQuery);
          console.log(`==>> Query saved for user ID: ${user._id}`);
        await user.save()
        console.log("yes or no")
        const imageButtons = [
            { id: "yes", title: "📸 Yes" },
            { id: "no", title: "❌ No" }
        ];
        await sendButtonMessage(phoneNumber, "Got it! 📱 Would you like to attach a reference image to help us find the best match? 🖼️", imageButtons, "0.1.2");
    }

    else if (btnReply?.toLowerCase() === "yes" && lastMessage.trim() === "0.1.2") {
        console.log("Awesome! 🎉 Please upload the image.")
        await sendTextMessage(phoneNumber, "Awesome! 🎉 Please upload the image.", "0.1.3");
    }
    else if (btnReply?.toLowerCase() === "no" && lastMessage.trim() === "0.1.2") {
        if (categories.length > 3) {
            const categorySections = [{
                title: "Select a Category",
                rows: categories.map(cat => ({ id: cat.id, title: cat.title }))
            }];
            await sendListMessage(phoneNumber, "No worries! 😊 Choose a category:", "Categories", categorySections, "0.1.4");
        } else {
            await sendButtonMessage(phoneNumber, "No worries! 😊 Choose a category:", categories, "0.1.4");
        }
    }

    else if (categories.some(cat => cat.id === listReply && lastMessage === "0.1.4")) {

        user.searchCategory = listReply;
        await user.save();
        await sendTextMessage(phoneNumber, "Thanks! 🙌 Now, could you share your pin location so we can find options near you? 📍", "0.1.5");
    }


    else if (lastMessage === "0.1.5") {
        console.log("location agai", location)

        if (!location?.latitude || !location?.longitude) {
            console.log("Location not received!");
            await sendTextMessage(phoneNumber, "Invalid location! Please share your live location again.", "0.1.5");
            return;
        }

        const { longitude, latitude } = location;
        user.pinLocation.coordinates[0] = longitude;
        user.pinLocation.coordinates[1] = latitude;
        user.pinLocation.co
        user.save()
        await sendTextMessage(phoneNumber, "Great! 👍 Lastly, how far should we search? Enter the radius in kilometers (e.g., 5, 10, etc.). 📏", "0.1.6");
    }



    else if (lastMessage === "0.1.6" && text) {
        console.log("MDG_PRODUCT", messagingProduct)

        const isValidRadius = (input) => /^[0-9]+$/.test(input) && Number(input) > 0;

        if (!isValidRadius(text)) {
            await sendTextMessage(phoneNumber, "❌ Invalid radius! Please enter a valid number in kilometers (e.g., 5, 10, etc.).", "0.1.6");
            return;
        }

        try {
            const radius = text;

            const user = await User.findOneAndUpdate(
                { phoneNumber },
                {
                    registrationSource: String(messagingProduct),
                    radius: radius
                },
                { upsert: true, new: true }
            );

            const userId = user._id;
            // const product = user.currentSearch;

            const buttons = [
                { id: "SearchHistory", title: "Search History" },
                { id: "Coins", title: "Coin" }
            ];

            await sendButtonMessage(phoneNumber, `🚀 Perfect! We’ll notify you as soon as we find the best matches. Welcome, ${profileName} !`, buttons, "0.8");

            let searchCriteria = {};
            if (user?.pinLocation?.coordinates[1] && user?.pinLocation?.coordinates[0] && user?.radius) {
                searchCriteria.pinLocation = {
                    $near: {
                        $geometry: { type: "Point", coordinates: [parseFloat(user.pinLocation.coordinates[0]), parseFloat(user.pinLocation.coordinates[1])] },
                        $maxDistance: user.radius * 1000, // Convert km to meters
                    },
                };
            }
            if (user?.searchCategory) {
                searchCriteria.shopCategory = { $in: user.searchCategory };
            }

            const matchVendors = await Vendor.find(searchCriteria);

            if (matchVendors.length > 0) {
                console.log("==>> Match Found!");

                let vendorDetails = matchVendors.map(vendor => ({
                    id: vendor._id,
                    phoneNumber: vendor.phoneNumber,
                }));

                console.log(vendorDetails, "vendor details");

                // Sare vendors ke queries save aur find karne ke liye promise array
                const queryPromises = vendorDetails.map(async (vendor) => {
                //     const queryId = new Date().getTime(); // Unique ID for each query

                const existingQuery = await Query.findOneAndUpdate(
                    {
                        $or: [
                            { vendorId: null }, // ✅ Initially vendorId null tha
                            { vendorId: new mongoose.Types.ObjectId(vendor.id) } // ✅ Match with updated vendorId
                        ],
                        userId: new mongoose.Types.ObjectId(userId),
                        product: user.currentSearch,
                        status: "waiting"
                    },
                    { 
                        $set: { 
                            vendorId: new mongoose.Types.ObjectId(vendor.id), // ✅ Update vendorId
                            updatedAt: new Date() 
                        } 
                    },
                    { new: true, upsert: true }
                );
                
                    if (existingQuery) {
                        console.log(`Skipping duplicate query for Vendor ${vendor.id} - Product: ${user.currentSearch}`);
                        return { vendor, pendingQueries: [existingQuery] }; // Sirf existing query return karo
                    }
                //     const newQuery = {
                //         queryId,
                //         userId,
                //         vendorId: vendor.id, // Send vendor ID one by one
                //         product,
                //     };

                //     //  Query create karna
                //     await Query.create(newQuery);
                //     console.log(`==>> Query saved for Vendor ID: ${vendor.id}`);

                    //  Query find karna
                    const pendingQueries = await Query.find({ vendorId: vendor.id, status: "waiting" });

                    return { vendor, pendingQueries }; // ==>> Return both vendor info and pending queries
                });

                // ==>> Sare queries ka result ek saath wait karna
                const allPendingQueries = await Promise.all(queryPromises);

                console.log(allPendingQueries, "queries");

                // ==>> Ab sirf un vendors ko message send karo jinke pending queries hain
                for (const { vendor, pendingQueries } of allPendingQueries) {
                    if (!pendingQueries.length) {
                        console.log(`==>> No pending queries for Vendor ID: ${vendor.id}`);
                        continue;
                    }

                    for (const query of pendingQueries) {
                        const button = [
                            { id: `Yes_avl|${query.queryId}`, title: "Yes" },
                            { id: "No_avl", title: "No" }
                        ];

                        await sendButtonMessage(
                            vendor?.phoneNumber,
                            `User is searching for ${query.product}. Do you have it available?`,
                            button,
                            `0.1.7_${query.queryId}`
                        );
                    }
                }
            }
        } catch (error) {
            console.error("==>> MongoDB Save/Contact Extraction Error:", error);
            await sendTextMessage(phoneNumber, "Oops! Something went wrong. Please try again.", "error");
        }
    }


   else if (btnReply?.toLowerCase().startsWith("yes_")) {
        console.log("==>> Vendor ne 'Yes' select kiya!");
        const [yes, queryId] = btnReply.split("|")
        console.log(queryId, "agayi beta")

        const query = await Query.findOne({ queryId: queryId, status: "waiting" });
        if (query) {
            console.log(query, "caste query")
            const vendorId = query?.vendorId;
            const vendor = await Vendor.findOne({ _id: vendorId });
            const response = `yes_${queryId}`
            await handleVendorResponse(vendor?.phoneNumber, queryId, response);
        }
        const expiredQuery = await Query.findOne({ queryId: queryId, status: "expired" });
        if (expiredQuery) {
            console.log(query, "caste query")
            const vendorId = expiredQuery?.vendorId;
            const vendor = await Vendor.findOne({ _id: vendorId });
            await sendTextMessage(vendor?.phoneNumber, "Oops! This query has been expired", "0.1.8")
        }
    }

    else if (text && lastMessage?.startsWith("0.1.8")) {
        console.log("lastmessssssssage", lastMessage)
        const [lastMessagee, recID] = lastMessage.split("_")
        console.log("rec iDDDDDDDdd", lastMessagee, recID)
        // const vendor = await Vendor.findOne({ phoneNumber });
        // const vendorPhone = vendor.phoneNumber;

        // ✅ Vendor ka diya price store karo
        // const updatedQuery = await Query.findOneAndUpdate(
        //     { vendorId: vendor._id, status: "waiting" },
        //     { priceByVendor: text, status: "answered" },
        //     { new: true }
        // );

        const updatedQuery = await Query.findOneAndUpdate(
            { queryId: recID, status: "waiting" }, 
            { priceByVendor: text, status: "answered" },
            { new: true }
        );
        console.log("khchjsdakjdhkhsdf", updatedQuery)

        const vendorId = updatedQuery?.vendorId;
        const vendor = await Vendor.findOne({ _id: vendorId });
        const vendorPhone = vendor?.phoneNumber;

        if (!updatedQuery) {
            return await sendTextMessage(vendorPhone, "⚠ Query expired or not found.", "error");
        }
        const user = updatedQuery?.userId;
        const userFound = await User.findOne({ _id: user });
        const userPhone = userFound?.phoneNumber;

        // vendor.temObj.priceSendToUsers = text;
        // await vendor.save();

        const buttons = [{ id: `view_details|${recID}`, title: "View Details" }];
        // const userPhone = vendor.temObj.messageSendToUsers;


        await sendButtonMessage(userPhone, "See to view the Vendor Details", buttons, "0.1.9");
    }


    else if (btnReply.toLowerCase().startsWith("view_details")) {
        console.log("lastmessssssssage", lastMessage)
        const [lastMessagee, recID] = btnReply.split("|")
        console.log("rec iDDDDDDDdd", lastMessagee, recID)

        //ye flow
        // const userFound = await User.findOne({ phoneNumber });

        const query = await Query.findOne({ queryId: recID });
        const userId = query?.userId;
        const user = await User.findOne({ _id: userId });
        const userFound = user;

        if (!userFound) return "User not found";

        // const vendorDetails = await Vendor.findOne({ phoneNumber: userFound.tempObj.matchVendor });
        const vendorId = query.vendorId;
        const vendor = await Vendor.findOne({ _id: vendorId });
        const vendorDetails = vendor;
        if (!vendorDetails) return "Vendor not found";

        const { pinLocation, address } = vendorDetails;
        if (!query.detailsViewed) {
            if (userFound.coins >= 1) {
                userFound.coins -= 1;
            await userFound.save()
            } else {
                return await sendTextMessage(userFound.phoneNumber, "⚠ Insufficient coins!", "error");
            }
            query.detailsViewed = true;
            await query.save();
        }
            const buttons = [
                { id: `unlock_contact|${recID}`, title: "Unlock Contact" },
                { id: `unlock_price|${recID}`, title: "Unlock Price" }
            ];

            const msg = `https://maps.google.com/maps?q=${pinLocation.coordinates[0]},${pinLocation.coordinates[1]}\n` +
                `Shop Address: ${address}`;

            await sendButtonMessage(userFound.phoneNumber, msg, buttons, "0.1.9.1");
        }
    


    else if (btnReply?.toLowerCase().startsWith("unlock_contact")) {
        const [one, two] = btnReply.split("|")
        console.log("unlock_contact", one, two)


        const query = await Query.findOne({ queryId: two })
        console.log(query, "query000")
        const user = query?.userId;
        console.log(user, "")
        const userFound = await User.findOne({ _id: user })


        if (!userFound) return "User not found";


        const vendor = query.vendorId;
        const vendorDetails = await Vendor.findOne({ _id: vendor })


        if (!vendorDetails) return "Vendor not found";
        if (!query.contactViewed) {
            if (userFound.coins >= 1) {
                userFound.coins -= 1;
            await userFound.save()
            } else {
                return await sendTextMessage(userFound.phoneNumber, "⚠ Insufficient coins!", "error");
            }
            query.contactViewed = true;
            await query.save();
        }

        // if (userFound.coins >= 1) {
        //     userFound.coins -= 1;
        //     await userFound.save();

            await sendTextMessage(userFound.phoneNumber, `Vendor Contact: ${vendorDetails.phoneNumber}`, "0.1.9.1");
             } 
    


    else if (btnReply?.toLowerCase().startsWith("unlock_price")) {
        const [one, two] = btnReply.split("|")
        console.log("Unlock_price", one, two)

        const query = await Query.findOne({ queryId: two })
        const user = query?.userId;
        const userFound = await User.findOne({ _id: user })

        if (!userFound) return "User not found";

        const priceProd = query.priceByVendor;
        if (!priceProd) return await sendTextMessage(userFound.phoneNumber, "⚠ Price not found!", "error");

        if (!query.priceViewed) {
            if (userFound.coins >= 1) {
                userFound.coins -= 1;
            await userFound.save()
            } else {
                return await sendTextMessage(userFound.phoneNumber, "⚠ Insufficient coins!", "error");
            }
            query.priceViewed = true;
            await query.save();
        }

            await sendTextMessage(userFound.phoneNumber, `Price: ${priceProd}`);

        } 

}






async function handleVendorResponse(vendorPhone, queryId, response) {
    try {
        const [yes, recID] = response.split("_")
        console.log("checcccccccccckkkk", yes, recID)
        // id = recID
        console.log("✅ Processing Vendor Response...", queryId);

        // ✅ Pehle check karo ke queryId valid ObjectId hai ya nahi
        let query;
        if (ObjectId.isValid(queryId)) {
            query = await Query.findOne({ _id: new ObjectId(queryId) });
        } else {
            query = await Query.findOne({ queryId: queryId }); // ✅ Query by queryId (string)
        }

        if (!query) return console.log("❌ Query not found!");

        const userId = query.userId;
        const vendorId = query.vendorId;
        const user = await User.findOne({ _id: userId });
        const vendor = await Vendor.findOne({ _id: vendorId })
        if (!user || !vendor) return console.log("❌ User or Vendor not found!");

        if (yes.toLowerCase() === "yes") {
            console.log("✅ Vendor is Available!");
            // query.status = "answered";
            // await query.save();
            // ✅ Vendor ka last message update karo
            // const vendor = await Vendor.findOne({ phoneNumber: vendorPhone });
            vendor.lastMessage = `0.1.8_${recID}`;
            await vendor.save();
            // vendor.temObj.messageSendToUsers = user.phoneNumber;
            // query.mess
            // console.log(vendor.temObj.messageSendToUsers, "number 2")
            // user.tempObj.matchVendor = vendor.phoneNumber;

            // await vendor.save();
            // await user.save();

            // ✅ User se price maangna shuru karo
            const customLastmess = `0.1.8_${recID}`
            await sendTextMessage(vendorPhone, "💰 What's the price of this product?", customLastmess);
        } else {
            console.log("❌ Vendor ne 'No' bola!");
            await sendTextMessage(userPhone, "😔 Sorry, this vendor is not available at the moment.");
        }
    } catch (error) {
        console.error("❌ Error in handleVendorResponse:", error);
    }
}
