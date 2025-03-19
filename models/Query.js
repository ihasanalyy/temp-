import mongoose from "mongoose";

const querySchema = new mongoose.Schema({
    queryId: {type: String, require: true , unique: true},
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor"},
    product: { type: String, required: true },
    status: { type: String, enum: ["waiting", "expired", "answered"], default: "waiting" },
    priceByVendor: { type: Number }, // Vendor ka diya hua price yahan store hoga
    contactViewed: { type: Boolean, default: false },
    priceViewed: { type: Boolean, default: false },
    detailsViewed: { type: Boolean, default: false },
}, { timestamps: true });

const Query = mongoose.model("Query", querySchema);

export default Query;