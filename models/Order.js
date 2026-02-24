import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
    _id: String,
    seq: { type: Number, default: 0 }
});

const Counter = mongoose.model("Counter", counterSchema);

const statusHistorySchema = new mongoose.Schema({
    status: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: String,
    timestamp: { type: Date, default: Date.now }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    order_id: {
        type: String,
        unique: true
    },
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    governate: {
        type: String,
        required: true,
        trim: true
    },
    net_cod: {
        type: Number,
        required: true,
        default: 0
    },
    shipping_price: {
        type: Number,
        required: true,
        default: 0
    },
    cod: {
        type: Number,
        default: 0
    },
    receiver: {
        name: String,
        phone: String,
        city: String,
        address: String
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedCompany: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    status: {
        type: String,
        enum: ["created", "assigned", "picked_up", "in_transit", "out_for_delivery", "delivered", "returned", "cancelled"],
        default: "created"
    },
    trackingCode: {
        type: String,
        unique: true
    },
    reference_code: {
        type: String,
        trim: true
    },
    senderCompany: {
        type: String,
        trim: true
    },
    notes: [{
        text: { type: String, required: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now }
    }],
    statusHistory: [statusHistorySchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Auto-calculate COD and generate order_id before saving
orderSchema.pre('save', async function () {
    this.cod = (this.net_cod || 0) + (this.shipping_price || 0);
    this.updatedAt = new Date();

    // Generate order_id if not exists
    if (!this.order_id) {
        const counter = await Counter.findByIdAndUpdate(
            { _id: 'order_id' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.order_id = 'ORD-' + String(counter.seq).padStart(6, '0');
    }
});

export default mongoose.model("Order", orderSchema);
