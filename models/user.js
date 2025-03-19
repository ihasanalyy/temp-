import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true }, // Name optional in WhatsApp 
  email: { type: String, unique: true, sparse: true }, // Web users ke liye unique
  password: { type: String, minlength: 6 }, // Web users ke liye
  phoneNumber: { type: String, unique: true, sparse: true }, // ==>> Common field (WhatsApp + Web)
  coins: { type: Number, default: 50 }, // ==>> Users get 50 coins on registration
  registrationSource: { type: String, enum: ["whatsapp", "web"] ,default: "web"}, // ==>> Tracks user source
  searchHistory: [{ query: String, timestamp: { type: Date, default: Date.now } }],
  language: { type: String, default: "en" }, // ==>> WhatsApp users ke liye language preference
  currentSearch: { type: String }, // ==>> WhatsApp bot ke liye
  lastMessage: { type: String }, // ==>> WhatsApp bot ke liye
  locationPage: { type: Number }, // ==>> Pagination in location selection
  category: { type: String }, // ==>> Stores selected category
  location: { type: String }, // ==>> Stores user's selected city
  searchTerm: { type: String }, // ==>> Stores search keyword
  pinLocation: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [24.8607, 67.0011] }, // [longitude, latitude]
},
  searchCategory: [{ type: String, trim: true }],
  radius: { type: Number }, // ==>> Stores search radius
  currentStep: { type: String, default: null }, // ==>> Tracks registration steps (WhatsApp only)
  historyPage: { type: Number }, // ==>> Pagination in history
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;