import Order from "../models/Order.js";
import ActivityLog from "../models/ActivityLog.js";

// Create Order
export const createOrder = async (req, res) => {
    try {
        const { customerName, phone, address, governate, net_cod, shipping_price,
            receiver, reference_code, senderCompany, assignedTo, assignedCompany } = req.body;

        // Validation
        if (!customerName || !phone || !address || !governate) {
            return res.status(400).json({ message: "Customer name, phone, address, and governate are required" });
        }

        const trackingCode = "TRK-" + Date.now();
        const initialStatus = (assignedTo || assignedCompany) ? "assigned" : "created";

        const order = new Order({
            customerName: customerName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            governate: governate.trim(),
            net_cod: parseFloat(net_cod) || 0,
            shipping_price: parseFloat(shipping_price) || 0,
            receiver,
            reference_code: reference_code?.trim(),
            senderCompany: senderCompany?.trim(),
            trackingCode,
            assignedTo: assignedTo || null,
            assignedCompany: assignedCompany || null,
            status: initialStatus,
            statusHistory: [{ status: initialStatus, changedBy: req.user?.id, note: "Order created" }]
        });

        const savedOrder = await order.save();

        // Activity log
        if (req.user) {
            await ActivityLog.create({
                action: "order_created",
                performedBy: req.user.id,
                targetType: "order",
                targetId: savedOrder._id,
                details: `Created order ${savedOrder.order_id} for ${customerName}`,
            });
        }

        res.status(201).json(savedOrder);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update Order (Edit)
export const updateOrder = async (req, res) => {
    try {
        const { customerName, phone, address, governate, net_cod, shipping_price,
            receiver, reference_code, senderCompany } = req.body;

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (customerName) order.customerName = customerName.trim();
        if (phone) order.phone = phone.trim();
        if (address) order.address = address.trim();
        if (governate) order.governate = governate.trim();
        if (net_cod !== undefined) order.net_cod = parseFloat(net_cod) || 0;
        if (shipping_price !== undefined) order.shipping_price = parseFloat(shipping_price) || 0;
        if (receiver) order.receiver = receiver;
        if (reference_code !== undefined) order.reference_code = reference_code?.trim();
        if (senderCompany !== undefined) order.senderCompany = senderCompany?.trim();

        const updated = await order.save();
        const populated = await Order.findById(updated._id)
            .populate('assignedTo', 'name email')
            .populate('assignedCompany', 'name email');

        if (req.user) {
            await ActivityLog.create({
                action: "order_updated",
                performedBy: req.user.id,
                targetType: "order",
                targetId: order._id,
                details: `Updated order ${order.order_id}`,
            });
        }

        res.json(populated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update Order Status
export const updateOrderStatus = async (req, res) => {
    try {
        const { status, note } = req.body;

        if (!status) return res.status(400).json({ message: "Status is required" });

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        const oldStatus = order.status;
        order.status = status;
        order.statusHistory.push({
            status,
            changedBy: req.user?.id,
            note: note || `Status changed from ${oldStatus} to ${status}`
        });

        await order.save();

        if (req.user) {
            await ActivityLog.create({
                action: "order_status_changed",
                performedBy: req.user.id,
                targetType: "order",
                targetId: order._id,
                details: `${order.order_id}: ${oldStatus} → ${status}`,
                metadata: { oldStatus, newStatus: status }
            });
        }

        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Orders with pagination and filters
export const getOrders = async (req, res) => {
    try {
        const { assignedTo, assignedCompany, status, page = 1, limit = 50, search, dateFrom, dateTo } = req.query;
        let query = {};

        if (assignedTo) query.assignedTo = assignedTo;
        if (assignedCompany) query.assignedCompany = assignedCompany;
        if (status) query.status = status;

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { customerName: searchRegex },
                { order_id: searchRegex },
                { reference_code: searchRegex },
                { phone: searchRegex },
                { governate: searchRegex },
                { senderCompany: searchRegex }
            ];
        }

        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
            if (dateTo) query.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
        }

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate('assignedTo', 'name email')
                .populate('assignedCompany', 'name email'),
            Order.countDocuments(query)
        ]);

        res.json({
            orders,
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
};

// Delete Order
export const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        const orderId = order.order_id;
        await Order.findByIdAndDelete(req.params.id);

        if (req.user) {
            await ActivityLog.create({
                action: "order_deleted",
                performedBy: req.user.id,
                targetType: "order",
                details: `Deleted order ${orderId}`,
            });
        }

        res.json({ message: "Order deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Add Note to Order
export const addOrderNote = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) return res.status(400).json({ message: "Note text is required" });

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        order.notes.push({
            text: text.trim(),
            createdBy: req.user?.id,
            createdAt: new Date()
        });

        await order.save();

        const populated = await Order.findById(order._id)
            .populate('notes.createdBy', 'name')
            .populate('assignedTo', 'name email')
            .populate('assignedCompany', 'name email');

        res.json(populated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get single order detail (with full history)
export const getOrderDetail = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('assignedTo', 'name email phone')
            .populate('assignedCompany', 'name email phone')
            .populate('notes.createdBy', 'name')
            .populate('statusHistory.changedBy', 'name');

        if (!order) return res.status(404).json({ message: "Order not found" });
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Assign Order to User
export const assignOrder = async (req, res) => {
    try {
        const { userId } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        order.assignedTo = userId || null;
        order.status = userId ? "assigned" : "created";
        order.statusHistory.push({
            status: order.status,
            changedBy: req.user?.id,
            note: userId ? "Assigned to user" : "Unassigned from user"
        });

        await order.save();

        const populated = await Order.findById(order._id)
            .populate('assignedTo', 'name email')
            .populate('assignedCompany', 'name email');

        if (req.user) {
            await ActivityLog.create({
                action: "order_assigned",
                performedBy: req.user.id,
                targetType: "order",
                targetId: order._id,
                details: `${order.order_id} ${userId ? 'assigned' : 'unassigned'}`,
            });
        }

        res.json(populated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Assign Order to Company
export const assignOrderToCompany = async (req, res) => {
    try {
        const { companyId } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        order.assignedCompany = companyId || null;
        order.status = companyId ? "assigned" : "created";
        order.statusHistory.push({
            status: order.status,
            changedBy: req.user?.id,
            note: companyId ? "Assigned to company" : "Unassigned from company"
        });

        await order.save();

        const populated = await Order.findById(order._id)
            .populate('assignedCompany', 'name email');

        res.json(populated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Bulk Assign to User
export const bulkAssignOrders = async (req, res) => {
    try {
        const { orderIds, userId } = req.body;
        if (!orderIds || !orderIds.length) return res.status(400).json({ message: "Order IDs required" });

        await Order.updateMany(
            { _id: { $in: orderIds } },
            {
                assignedTo: userId || null,
                status: userId ? "assigned" : "created",
                updatedAt: new Date(),
                $push: {
                    statusHistory: {
                        status: userId ? "assigned" : "created",
                        changedBy: req.user?.id,
                        note: "Bulk assigned"
                    }
                }
            }
        );

        if (req.user) {
            await ActivityLog.create({
                action: "order_bulk_assigned",
                performedBy: req.user.id,
                targetType: "order",
                details: `Bulk assigned ${orderIds.length} orders`,
                metadata: { count: orderIds.length }
            });
        }

        res.json({ message: "Orders assigned successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Bulk Assign to Company
export const bulkAssignOrdersToCompany = async (req, res) => {
    try {
        const { orderIds, companyId } = req.body;
        if (!orderIds || !orderIds.length) return res.status(400).json({ message: "Order IDs required" });

        await Order.updateMany(
            { _id: { $in: orderIds } },
            {
                assignedCompany: companyId || null,
                status: companyId ? "assigned" : "created",
                updatedAt: new Date(),
                $push: {
                    statusHistory: {
                        status: companyId ? "assigned" : "created",
                        changedBy: req.user?.id,
                        note: "Bulk assigned to company"
                    }
                }
            }
        );

        res.json({ message: "Orders assigned to company successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Bulk Update Status
export const bulkUpdateOrderStatus = async (req, res) => {
    try {
        const { orderIds, status } = req.body;
        if (!orderIds || !orderIds.length || !status) {
            return res.status(400).json({ message: "Order IDs and status required" });
        }

        await Order.updateMany(
            { _id: { $in: orderIds } },
            {
                status,
                updatedAt: new Date(),
                $push: {
                    statusHistory: {
                        status,
                        changedBy: req.user?.id,
                        note: "Bulk status update"
                    }
                }
            }
        );

        if (req.user) {
            await ActivityLog.create({
                action: "order_bulk_status",
                performedBy: req.user.id,
                targetType: "order",
                details: `Bulk status update to "${status}" for ${orderIds.length} orders`,
                metadata: { count: orderIds.length, status }
            });
        }

        res.json({ message: "Orders status updated successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Bulk Delete Orders
export const bulkDeleteOrders = async (req, res) => {
    try {
        const { orderIds } = req.body;
        if (!orderIds || !orderIds.length) return res.status(400).json({ message: "Order IDs required" });

        await Order.deleteMany({ _id: { $in: orderIds } });

        if (req.user) {
            await ActivityLog.create({
                action: "order_bulk_deleted",
                performedBy: req.user.id,
                targetType: "order",
                details: `Bulk deleted ${orderIds.length} orders`,
                metadata: { count: orderIds.length }
            });
        }

        res.json({ message: "Orders deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Assign Order by Code (Scanner)
export const assignOrderByCode = async (req, res) => {
    try {
        const { code, userId, companyId, status } = req.body;

        if (!code) return res.status(400).json({ message: "Code is required" });
        if (!userId && !companyId) return res.status(400).json({ message: "User ID or Company ID is required" });

        const order = await Order.findOne({
            $or: [
                { order_id: code },
                { reference_code: code }
            ]
        });

        if (!order) return res.status(404).json({ message: `Order with code "${code}" not found` });

        if (userId) order.assignedTo = userId;
        if (companyId) order.assignedCompany = companyId;

        const newStatus = status || "assigned";
        order.status = newStatus;
        order.statusHistory.push({
            status: newStatus,
            changedBy: req.user?.id,
            note: `Scanned and assigned`
        });

        await order.save();

        const populatedOrder = await Order.findById(order._id)
            .populate('assignedTo', 'name email')
            .populate('assignedCompany', 'name email');

        res.json(populatedOrder);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Bulk import orders from Excel/CSV
export const bulkImportOrders = async (req, res) => {
    try {
        const { orders: orderData } = req.body;

        if (!orderData || !Array.isArray(orderData) || orderData.length === 0) {
            return res.status(400).json({ message: "No orders data provided" });
        }

        if (orderData.length > 500) {
            return res.status(400).json({ message: "Maximum 500 orders per import" });
        }

        const results = { success: 0, failed: 0, errors: [] };

        for (const item of orderData) {
            try {
                if (!item.customerName || !item.phone || !item.address || !item.governate) {
                    results.failed++;
                    results.errors.push(`Row missing required fields: ${item.customerName || 'Unknown'}`);
                    continue;
                }

                const order = new Order({
                    customerName: item.customerName.trim(),
                    phone: String(item.phone).trim(),
                    address: item.address.trim(),
                    governate: item.governate.trim(),
                    net_cod: parseFloat(item.net_cod) || 0,
                    shipping_price: parseFloat(item.shipping_price) || 0,
                    reference_code: item.reference_code?.trim(),
                    senderCompany: item.senderCompany?.trim(),
                    trackingCode: "TRK-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
                    statusHistory: [{ status: "created", changedBy: req.user?.id, note: "Imported from Excel" }]
                });

                await order.save();
                results.success++;
            } catch (err) {
                results.failed++;
                results.errors.push(`${item.customerName || 'Unknown'}: ${err.message}`);
            }
        }

        if (req.user) {
            await ActivityLog.create({
                action: "order_created",
                performedBy: req.user.id,
                targetType: "order",
                details: `Bulk imported ${results.success} orders (${results.failed} failed)`,
            });
        }

        res.json(results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
