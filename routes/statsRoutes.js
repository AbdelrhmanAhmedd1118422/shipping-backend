import express from "express";
import { protect } from "../middleware/auth.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Shipment from "../models/Shipment.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const daysNum = Math.min(365, Math.max(1, parseInt(days)));

        const totalOrders = await Order.countDocuments();
        const orders = await Order.find();

        const totalRevenue = orders.reduce((sum, order) => sum + (order.cod || 0), 0);
        const totalUsers = await User.countDocuments();

        const activeShipments = await Shipment.countDocuments({
            status: { $nin: ["delivered", "cancelled", "returned"] }
        });

        const ordersByStatus = await Order.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5);

        // Dynamic date range
        const dateAgo = new Date();
        dateAgo.setDate(dateAgo.getDate() - daysNum);

        const ordersPerDay = await Order.aggregate([
            { $match: { createdAt: { $gte: dateAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 },
                    revenue: { $sum: "$cod" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const codByGovernate = await Order.aggregate([
            { $match: { governate: { $exists: true, $ne: "" } } },
            {
                $group: {
                    _id: "$governate",
                    totalCod: { $sum: "$cod" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalCod: -1 } }
        ]);

        res.json({
            stats: {
                totalRevenue,
                totalOrders,
                totalUsers,
                activeShipments
            },
            ordersByStatus,
            recentOrders,
            ordersPerDay,
            codByGovernate
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
