/**
 * Seed script — creates the initial admin user.
 * 
 * Usage:  node seed.js
 * 
 * Default credentials:
 *   Email:    admin@goldenway.com
 *   Password: Admin@2026
 * 
 * You can override them via env vars:
 *   ADMIN_EMAIL=...  ADMIN_PASSWORD=...  node seed.js
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@goldenway.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@2026";

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");

        // Check if admin already exists
        const existing = await User.findOne({ email: ADMIN_EMAIL });
        if (existing) {
            console.log(`Admin user already exists: ${ADMIN_EMAIL}`);
            console.log("If you need to reset the password, delete the user first and re-run this script.");
            process.exit(0);
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

        const admin = new User({
            name: "Admin",
            phone: "0000000000",
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: "Admin",
            status: "active",
        });

        await admin.save();
        console.log("✅ Admin user created successfully!");
        console.log(`   Email:    ${ADMIN_EMAIL}`);
        console.log(`   Password: ${ADMIN_PASSWORD}`);
        console.log("\n⚠️  Change the password after first login for security.");

        process.exit(0);
    } catch (err) {
        console.error("Seed failed:", err.message);
        process.exit(1);
    }
}

seed();
