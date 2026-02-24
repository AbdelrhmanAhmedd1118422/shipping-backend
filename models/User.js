import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    password: { type: String, required: true },
    role: { type: String, default: "User" },
    status: { type: String, default: "active" },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", userSchema);
