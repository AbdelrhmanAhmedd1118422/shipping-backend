import express from "express";
import { protect, requireRole } from "../middleware/auth.js";
import { getUsers, createUser, deleteUser } from "../controllers/userController.js";

const router = express.Router();

router.use(protect);

router.get("/", getUsers);
router.post("/", requireRole("Admin", "Manager"), createUser);
router.delete("/:id", requireRole("Admin"), deleteUser);

export default router;
