
const testStats = async () => {
    try {
        console.log("Testing Stats API...");
        const response = await fetch("http://localhost:5000/api/stats");
        const data = await response.json();

        console.log("Status:", response.status);
        console.log("Keys in response:", Object.keys(data));
        if (data.codByGovernate) {
            console.log("codByGovernate:", JSON.stringify(data.codByGovernate, null, 2));
        } else {
            console.log("codByGovernate is MISSING");
        }
    } catch (err) {
        console.error("Fetch Error:", err);
    }
};

testStats();
