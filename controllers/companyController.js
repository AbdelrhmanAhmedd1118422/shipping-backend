import Company from "../models/Company.js";
import ActivityLog from "../models/ActivityLog.js";

export const getCompanies = async (req, res) => {
    try {
        const companies = await Company.find().sort({ createdAt: -1 });
        res.json(companies);
    } catch (err) {
        res.status(500).json({ message: "Error fetching companies" });
    }
};

export const createCompany = async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;

        if (!name || !email || !phone || !address) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const newCompany = new Company({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            address: address.trim(),
        });
        await newCompany.save();

        if (req.user) {
            await ActivityLog.create({
                action: "company_created",
                performedBy: req.user.id,
                targetType: "company",
                targetId: newCompany._id,
                details: `Created company ${name}`,
            });
        }

        res.status(201).json(newCompany);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

export const deleteCompany = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) return res.status(404).json({ message: "Company not found" });

        const companyName = company.name;
        await Company.findByIdAndDelete(req.params.id);

        if (req.user) {
            await ActivityLog.create({
                action: "company_deleted",
                performedBy: req.user.id,
                targetType: "company",
                details: `Deleted company ${companyName}`,
            });
        }

        res.json({ message: "Company deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting company" });
    }
};
