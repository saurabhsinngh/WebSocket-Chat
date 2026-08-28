const mongoose = require("mongoose");

const connectionDb = async ()=> {
    console.log("process.env.MONGO_URI:::::::", process.env.MONGO_URI);
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log("Mongodb database connection establishes successfully.")
    } catch (error) {
        console.log("Error in database connection", error.message);
        process.exit(1);
    }
}

module.exports = connectionDb;