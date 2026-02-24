
import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "./models/Order.js";

dotenv.config();

const checkOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const orders = await Order.find({});
        console.log(`Found ${orders.length} orders.`);

        orders.forEach((order, index) => {
            console.log(`Order #${index + 1}:`);
            console.log(`  ID: ${order.order_id}`);
            console.log(`  Ref Code: '${order.reference_code}'`);
            console.log(`  Customer: '${order.customerName}'`);
            console.log(`  Phone: '${order.phone}'`);
            console.log(`  Governate: '${order.governate}'`);
            console.log(`  Assigned: '${order.assignedTo}'`);
            console.log("  -------------------");
        });

        mongoose.connection.close();
    } catch (err) {
        console.error("Error:", err);
    }
};

checkOrders();
