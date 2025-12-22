const mongoose = require("mongoose")

const connectDB = async ()=>{
    try{
        await mongoose.connect("mongodb://127.0.0.1:27017/expense_tracker");
        console.log("MongoDb connected");
    }catch(error){
        console.error("MongoDB connection falied", error.message);
        process.exit(1);
    }
};

module.exports = connectDB