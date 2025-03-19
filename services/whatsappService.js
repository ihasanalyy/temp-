import axios from "axios";

export const sendMessage = async (data) => {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v22.0/${process.env.PHONE_NUMBER_ID}/messages`,
            data,
            {
                headers: {
                    "Authorization": `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error("❌ Error sending message:");
        if (error.response) {
            console.error("Response Data:", error.response.data);
        } else {
            console.error("Error Message:", error.message);
        }
        return null;
    }
};


