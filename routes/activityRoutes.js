import express from "express";
import { protect } from "../middleware/auth.js";
import ActivityLog from "../models/ActivityLog.js";

const router = express.Router();

// Get activity logs (admin only) with pagination
router.get("/", protect, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const [logs, total] = await Promise.all([
            ActivityLog.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate("performedBy", "name email role"),
            ActivityLog.countDocuments()
        ]);

        res.json({
            logs,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
