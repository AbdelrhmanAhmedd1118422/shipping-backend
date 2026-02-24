import express from "express";
import bcrypt from "bcryptjs";
import { protect } from "../middleware/auth.js";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";

const router = express.Router();

// Change password
router.put("/password", protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current and new password are required" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters" });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        await ActivityLog.create({
            action: "password_changed",
            performedBy: req.user.id,
            targetType: "user",
            targetId: req.user.id,
            details: `${user.name} changed their password`,
        });

        res.json({ message: "Password changed successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get current user profile
router.get("/profile", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update profile (name, email)
router.put("/profile", protect, async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (name) user.name = name.trim();
        if (email) user.email = email.trim();
        await user.save();

        const updated = user.toObject();
        delete updated.password;

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
