const mongoose = require("mongoose");


const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    members: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    status:{
        type: String,
        enum:["OPEN", "SETTLED"]
    },
    createdAt:{
        type: Date,
        default: Date.now
    }

})
const Group = mongoose.model("Group", groupSchema);

module.exports = Group;