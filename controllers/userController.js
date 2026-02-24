import bcrypt from "bcryptjs";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";

export const getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const createUser = async (req, res) => {
    try {
        const { name, phone, email, role, status, password } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ message: "Name and phone are required" });
        }

        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.status(400).json({ message: "User with this phone already exists" });
        }

        if (email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) {
                return res.status(400).json({ message: "User with this email already exists" });
            }
        }

        const rawPassword = password || "password123";
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawPassword, salt);

        const newUser = new User({
            name: name.trim(),
            phone: phone.trim(),
            email: email?.trim(),
            role: role || "User",
            status: status || "active",
            password: hashedPassword,
        });

        const savedUser = await newUser.save();
        const userResponse = savedUser.toObject();
        delete userResponse.password;

        if (req.user) {
            await ActivityLog.create({
                action: "user_created",
                performedBy: req.user.id,
                targetType: "user",
                targetId: savedUser._id,
                details: `Created user ${name} (${role || 'User'})`,
            });
        }

        res.status(201).json(userResponse);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const userName = user.name;
        await User.findByIdAndDelete(id);

        if (req.user) {
            await ActivityLog.create({
                action: "user_deleted",
                performedBy: req.user.id,
                targetType: "user",
                details: `Deleted user ${userName}`,
            });
        }

        res.json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
