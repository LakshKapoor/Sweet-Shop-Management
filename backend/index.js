const express = require("express");
const connectDB = require("./config/db")
const Expense = require("./models/expense")
const cors = require("cors")
const calculateBalances = require("./utils/calculateBalances")
const Group = require("./models/group")
const bcrypt = require("bcryptjs");
const User = require("./models/users");
const jwt =require("jsonwebtoken")
const auth = require("./middleware/auth")

const app = express();
app.use(express.json());

app.use(cors())

// app.get("/ping", (req, res)=>{
//     res.send("backend alive")
// })

connectDB();

app.get("/health", (req, res) => {
    res.json({status: "ok"});
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

app.post("/api/auth/register", async (req, res)=>{
    const {name, email, password} = req.body

    if(!name || !email || !password){
        return res.status(400).json({message: "All fields are required"});
    }
    try{
        const existingUser = await User.findOne({email})
        if(existingUser){
            return res.status(400).json({message: "Email already registered"});
        }

        const hashedPassword =  await bcrypt.hash(password, 10)

        const user =  await User.create({
            name,
            email,
            password: hashedPassword,
        })
        return res.status(201).json({message: "User registered",
            userId: user._id,
        });
        
    }
    catch(error){
        console.error(error)
        return res.status(500).json({message: "Registration failed"});

    }
})

app.post("/api/auth/login", async (req, res)=>{
    const {email, password} = req.body;

    if(!email || !password){
        return res.status(400).json({message: "Email and password Required"});
    }
    try{
        const user = await User.findOne({email})

        if(!user){
            return res.status(401).json({message:"Invalid Credentials"});
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch){
            return res.status(401).json({message:"Invalid Credentials"});

        }

        const token =jwt.sign(
            { userId: user._id},
            "SECRET_KEY",
            {expiresIn: "7d"}
        )
        return res.status(200).json({
            message:"Login successful",
            token,
            userId: user._id,
            name: user.name,
        });
}
    catch(error){
        console.error("Login error:", error)
        return res.status(500).json({message:"Login Failed", error: error.message})
    }

});

app.post("/api/expenses",auth, async (req, res)=>{
    const {title, amount, groupId, splits: customSplits} = req.body;
    const paidBy =  req.user.userId


    if(!title ||
        !amount ||
        !groupId){
        return res.status(400).json({message: "Invalid expense data"})
    }

    try {

        const group = await Group.findById(groupId)
        if(!group){
            return res.status(404).json({message:"Group not found"})
        }

        if(!group.members.includes(paidBy)){
            return res.status(400).json({
                message: "PaidBy user must be a group member"
            })
        }

        if(group.status === "SETTLED"){
            return res.status(400).json({message:"Group is already settled. cannot add new expense"})
        }
    
        let splits;

        // If custom splits are provided, use them
        if(customSplits && Array.isArray(customSplits) && customSplits.length > 0){
            // Validate custom splits
            const splitSum = customSplits.reduce((sum, split) => sum + (Number(split.share) || 0), 0);
            
            if(Math.abs(splitSum - amount) > 0.01){ // Allow small floating point differences
                return res.status(400).json({
                    message: `Split amounts (${splitSum}) must equal total amount (${amount})`
                })
            }

            // Validate all split users are group members
            for(const split of customSplits){
                if(!group.members.includes(split.userId)){
                    return res.status(400).json({
                        message: `User ${split.userId} is not a group member`
                    })
                }
            }

            // Validate paidBy is in splits
            const paidByInSplits = customSplits.some(split => split.userId === paidBy);
            if(!paidByInSplits){
                return res.status(400).json({
                    message: "PaidBy user must be included in splits"
                })
            }

            // Create splits with status
            splits = customSplits.map((split)=>({
                userId: split.userId,
                share: Number(split.share),
                status: split.userId == paidBy ? "CONFIRMED" : "UNPAID",
            }))
        } else {
            // Default: equal split among all group members
            const shareAmount = amount/group.members.length;
            splits = group.members.map((userId)=>({
                userId,
                share: shareAmount,
                status: userId == paidBy ? "CONFIRMED" : "UNPAID",
            }))
        }
        
        const expense = await Expense.create({
            title, 
            amount, 
            groupId,
            paidBy, 
            splits,
        })
        return res.status(201).json({
            message: "Expense added",
            expense
        });

    } catch (error) {
        console.error("Mongoose Error:", error.message)
        return res.status(500).json({
            message: error.message
        })
    }

    
});

app.get("/api/expenses",auth, async (req, res)=>{
    const {groupId} = req.query;
    console.log("Incoming expense body : ", req.body)

    try {
        let expenses
        
        if(groupId){
            expenses = await Expense.find({groupId})
            .populate("paidBy", "name")
            .populate("splits.userId", "name")
        } else {
            expenses = await Expense.find()
        }
        return res.status(200).json(expenses)

    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch expenses"
          })
    }
});

app.put("/api/expenses/:id", async (req, res) =>{
    const { id } =  req.params;
    const {title, amount, category} = req.body;

    if(!title || !amount || amount<=0){
        return res.status(400).json({message:"Invalid Expense Data"})
    }

    try {
        const updatedExpense = await Expense.findByIdAndUpdate(
            id,
            {title, amount, category},
            {new: true}
        );

        if(!updatedExpense){
            return res.status(404).json({message:"Expense not found"})
        }

        return res.status(200).json({
            message:"Expense updated",
            expense: updatedExpense
        })
    } catch (error) {
        return res.status(500).json({
            message:"failed to update expense"
        })
    }
    
});

app.delete("/api/expenses/:id", async (req, res)=>{
    const {id} = req.params
    
    try {
        const deletedExpense = await Expense.findByIdAndDelete(id)

        if(!deletedExpense){
            return res.status(404).json({message:"Expense not found"})
        }

        return res.status(200).json({message:"Expense deleted"})
    } catch (error) {
        return res.status(500).json({
            message:"failed to delete expense"
        });
        
    }
})

app.post("/api/groups", async (req, res) =>{
    const {name, members} = req.body;
    const creatorId = req.user.userId
    
    if(!name || !members || members.length === 0){
        return res.status(400).json({message:"Invalid group data"})
    }
    
    const uniqueMembers = Array.from(
        new Set([creatorId, ...(members || [])])
    )
    try {
        const group = await Group.create({
            name, 
            members: uniqueMembers,
        })
        return res.status(201).json({message:"Group created", group})
    } catch (error) {
        console.error(error)
        return res.status(500).json({message:"Failed to create group"})
    }

})

app.get("/api/groups", async (req, res) =>{
    const {groupId} = req.query;

    try {
        const filter = groupId ? {groupId} : {};
        const groups = await Group.find()
        return res.status(200).json(groups)
    } catch (error) {
        return res.status(500).json({message:"Failed to fetch groups"})
    }
})

app.get("/api/groups/:groupId/balances" , async (req, res) =>{

    const {groupId} = req.params

    try{
        const expenses = await Expense.find({groupId})

        const balances = calculateBalances(expenses)

        return res.status(200).json(balances)
    }
    catch(error){
        console.error(error)
        return res.status(500).json({ message:"Failed to calculate balances"})
    }
})

app.post("/api/expenses/:expenseId/confirm", async (req,res)=>{
    const {expenseId} = req.params
    const {userId} = req.body

    try {
        const expense = await Expense.findById(expenseId)
        if(!expense){
            return res.status(404).json({message:"Expense not found"})
        }

        if(expense.paidBy.toString()!=userId){
            return res.status(403).json({message:"Not authorized to confirm payment"})
        }

        const split = expense.splits.find(
            (s)=>s.status === "PAID"
        )

        if(!split){
            return res.status(404).json({message:"Split not found"})
        }

        split.status = "CONFIRMED"

        await expense.save()

        return res.status(200).json({
            message :"Payment Confirmed",
            expense
        })

        
    } catch (error) {
        console.error(error)
        return res.status(503).json({message:"Failed to confirm payment"})
    }
})

app.post("/api/expenses/:expenseId/pay",async (req,res)=>{
    const {expenseId}= req.params
    const {userId}= req.body

    try {
        const expense = await Expense.findById(expenseId)

        if(!expense){
            return res.status(404).json({message:"Expense not found"})
        }

        const split = expense.splits.find(
            (s)=> s.userId.toString() == userId
        )

        if(!split){
            return res.status(404).json({message:"Split not found"}) 
        }

        if(split.status !== "UNPAID"){
            return  res.status(400).json({message:"Payment already marked or confirmed"})
        }

        split.status = "PAID"

        await expense.save()

        return  res.status(200).json({
            message:"Payment marked as paid",
            expense
        })


    } catch (error) {
        console.error(error)
        return res.status(500).json({message:"Expense not found"})
    }
})

app.post("/api/groups/:groupId/settle", async (req, res)=>{

    console.log("Settle Api hit", req.params.groupId)
    const { groupId }= req.params

    try{
        const group = await Group.findById(groupId)

        if(!group){
            return res.status(404).json({message:"Group not found"})
        }
        if(group.status === "SETTLED"){
            return res.status(404).json({message:"Group already settled"})
        }
        const expenses = await Expense.find({ groupId})

        for(const expense of expenses){
            for(const split of expense.splits){
                split.status = "CONFIRMED"

            }
            await expense.save()
        }
        
        group.status = "SETTLED"
        await group.save()

        return  res.status(200).json({
            message:"Group Settled Successfully"
        })

    }
    catch (error) {
    console.error(error)
    return res.status(500).json({message:"Failed to settle group"})
}
})