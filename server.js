import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';

// Import Routes
import authRoutes from './routes/userAuthRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import vendorAuthRoutes from './routes/vendorAuthRoutes.js';
import vendorCrudRoutes from './routes/vendorsCRUDroutes.js';
import userRoutes from './routes/userRoutes.js';
import whatsappRoutes from './routes/whatsappRoutes.js';
import "./utils/cronJobHandler/cronJob.js";

// Middleware
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Connect to MongoDB
connectDB();

// Web Portal Routes
app.use('/api/user/auth', authRoutes);
app.use('/api/vendor/auth', vendorAuthRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/vendor', vendorCrudRoutes);
app.use('/api/user', userRoutes);

// WhatsApp Chatbot Routes
app.use("/api/whatsapp", whatsappRoutes);

// Root Route
app.get("/", (req, res) => {
    res.send("🚀 Server Running: Web Portal + WhatsApp Bot");
});

// Start Server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
