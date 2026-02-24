import express from "express";
import { protect, requireRole } from "../middleware/auth.js";
import {
    createOrder,
    getOrders,
    getOrderDetail,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    assignOrder,
    assignOrderToCompany,
    bulkAssignOrders,
    bulkAssignOrdersToCompany,
    bulkUpdateOrderStatus,
    bulkDeleteOrders,
    assignOrderByCode,
    addOrderNote,
    bulkImportOrders
} from "../controllers/orderController.js";

const router = express.Router();

// All order routes require authentication
router.use(protect);

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id/detail", getOrderDetail);
router.put("/:id/edit", updateOrder);
router.post("/:id/notes", addOrderNote);
router.put("/bulk-assign", requireRole("Admin", "Manager"), bulkAssignOrders);
router.put("/bulk-assign-company", requireRole("Admin", "Manager"), bulkAssignOrdersToCompany);
router.put("/bulk-status", requireRole("Admin", "Manager"), bulkUpdateOrderStatus);
router.delete("/bulk-delete", requireRole("Admin", "Manager"), bulkDeleteOrders);
router.put("/assign-by-code", assignOrderByCode);
router.put("/:id/status", updateOrderStatus);
router.delete("/:id", requireRole("Admin", "Manager"), deleteOrder);
router.put("/:id/assign", requireRole("Admin", "Manager"), assignOrder);
router.put("/:id/assign-company", requireRole("Admin", "Manager"), assignOrderToCompany);
router.post("/bulk-import", requireRole("Admin", "Manager"), bulkImportOrders);

export default router;
