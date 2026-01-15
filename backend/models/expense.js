const mongoose = require("mongoose");

const splitSchema = new mongoose.Schema({
    userId:{
         type: mongoose.Schema.Types.ObjectId,
        // ref: "User",
        
        
        required: true
    },
    share:{
        type: Number,
        required: true
    },
    status:{
        type: String,
        enum: ["PAID","UNPAID","CONFIRMED"],
        default: "UNPAID",
        required: true
    },
})

const expenseSchema = new mongoose.Schema({
    title:{
        type:String,
        required: true
    },

    amount:{
        type: Number,
        required:true
    },
    groupId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true
    },
    paidBy:{
        type: mongoose.Schema.Types.ObjectId,
        // ref: "User",
        // required: true
        required: true

    },
    splits:{
        type: [splitSchema],
        required: true
    },

    createdAt:{
        type: Date,
        default: Date.now
    },
});

const Expense = mongoose.model("Expense", expenseSchema);


module.exports = Expense;