import express from "express";
import { protect, requireRole } from "../middleware/auth.js";
import { getCompanies, createCompany, deleteCompany } from "../controllers/companyController.js";

const router = express.Router();

router.use(protect);

router.get("/", getCompanies);
router.post("/", requireRole("Admin", "Manager"), createCompany);
router.delete("/:id", requireRole("Admin"), deleteCompany);

export default router;
