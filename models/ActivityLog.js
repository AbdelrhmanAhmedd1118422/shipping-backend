import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: [
            "login",
            "order_created", "order_updated", "order_deleted", "order_status_changed",
            "order_assigned", "order_bulk_assigned", "order_bulk_status", "order_bulk_deleted",
            "user_created", "user_deleted",
            "company_created", "company_deleted",
            "password_changed"
        ]
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    targetType: {
        type: String,
        enum: ["order", "user", "company", "system"]
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId
    },
    details: {
        type: String
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for fast queries
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ performedBy: 1 });

export default mongoose.model("ActivityLog", activityLogSchema);
