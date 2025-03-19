import express from "express";
import { handleIncomingMessage } from "../controllers/whatsappController.js";
import { verifyWebhook } from "../controllers/verifyWebhook.js";

const router = express.Router();

// Webhook Verification Route (For GET request)
router.get("/webhook", verifyWebhook); 

// Handle Incoming Messages (For POST request)
router.post("/webhook", handleIncomingMessage);

export default router;