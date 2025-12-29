const express = require("express");
const connectDB = require("./config/db")
const Expense = require("./models/expense")
const cors = require("cors")
const calculateBalances = require("./utils/calculateBalances")

const app = express();
app.use(express.json());

app.use(cors())


app.get("/health", (req, res) => {
    res.json({status: "ok"});
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

app.post("/api/auth/register", (req, res)=>{
    const {email, password} = req.body;
    if(!email || !password){
        return res.status(400).json({message: "Email and password are required"});
    }

    return res.status(201).json({message: "User registered successfully (mock)"});
})

app.post("/api/auth/login", (req, res)=>{
    const {email, password} = req.body;

    if(!email || !password){
        return res.status(400).json({message: "Email and password Required"});
    }

    if(email !=="test@example.com" || password !== "password123"){
        return res.status(401).json({message:"Invalid Credentials"});
    }

    return res.status(200).json({message:"Login successful (mock)"});

});

app.post("/api/expenses",async (req, res)=>{
    const {description, amount, groupId,paidBy, splitBetween} = req.body;

    if(!description ||
        !amount ||
        !groupId ||
        !paidBy ||
        splitBetween===0){
        return res.status(400).json({message: "Invalid expense data"})
    }

    const shareAmount = amount/splitBetween.length;

    const splits = splitBetween.map((userId)=>({
        userId,
        share: shareAmount,
        status: userId == paidBy ? "CONFIRMED" : "UNPAID",
    }))

    try {
        const expense = await Expense.create({
            description, 
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
        console.error(error)
        return res.status(500).json({
            message: "Failed to add expense"
        })
    }

    
});

app.get("/api/expenses",async (req, res)=>{
    try {
        const expenses = await Expense.find()
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

app.get("/api/groups/:groupId/balances" , async (req, res) =>{

    const groupId = req.params

    try{
        const expenses = await Expense.find({groupId})

        const balances = calculateBalances(expenses)

        return res.status(200).json(balances)
    }
    catch(err){
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
            (s)=>s.userId.toString() == userId
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

app.post("/api/expenses/:expensesId/pay",async (req,res)=>{
    const {expenseId}= req.params
    const {userId}= req.body

    try {
        const expense = await Expense.findById.(expenseId)

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

        return  res.status(404).json({
            message:"Payment marked as paid",
            expense
        })


    } catch (error) {
        console.error(error)
        return res.status(500).json({message:"Expense not found"})
    }
})



connectDB();