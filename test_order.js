
const createOrder = async () => {
    try {
        console.log("Testing Create Order...");
        const response = await fetch("http://localhost:5000/api/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                customerName: "Test Debugger",
                phone: "55555555",
                address: "Debug Street 1",
                governate: "Cairo",
                net_cod: 50,
                shipping_price: 10,
                receiver: {
                    name: "Recv Debug",
                    phone: "11111111",
                    city: "Giza",
                    address: "Giza St"
                }
            })
        });

        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Fetch Error:", err);
    }
};

createOrder();
