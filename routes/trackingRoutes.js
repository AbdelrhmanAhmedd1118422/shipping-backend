import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

// Public tracking endpoint — no auth required
router.get("/:code", async (req, res) => {
  try {
    const code = req.params.code?.trim();
    if (!code) return res.status(400).json({ message: "Tracking code is required" });

    const order = await Order.findOne({
      $or: [
        { trackingCode: code },
        { order_id: code },
        { reference_code: code }
      ]
    }).populate('assignedCompany', 'name')
      .populate('statusHistory.changedBy', 'name');

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Return only public-safe fields
    res.json({
      order_id: order.order_id,
      trackingCode: order.trackingCode,
      status: order.status,
      customerName: order.customerName,
      governate: order.governate,
      address: order.address,
      phone: order.phone,
      senderCompany: order.senderCompany,
      assignedCompany: order.assignedCompany?.name,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      statusHistory: order.statusHistory.map(h => ({
        status: h.status,
        note: h.note,
        timestamp: h.timestamp,
        changedBy: h.changedBy?.name
      })),
      receiver: order.receiver
    });
  } catch (err) {
    res.status(500).json({ message: "Error tracking order" });
  }
});

export default router;
