import mongoose from "mongoose";

const shipmentSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    status: { type: String, default: "created" },
    currentLocation: String,
    history: [{
        status: String,
        location: String,
        timestamp: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Shipment", shipmentSchema);
