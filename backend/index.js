const express = require("express");
const connectDB = require("./config/db")

const app = express();
app.use(express.json());

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

app.post("/api/expenses",(req, res)=>{
    const {title, amount, category} = req.body;

    if(!title || !amount || amount<=0){
        return res.status(400).json({message: "Invalid expense data"})
    }

    return res.status(201).json({
        message: "Expense added (mock)",
        expense:{
            title,
            amount,
            category
        }
    });
});

app.get("/api/expenses",(req, res)=>{
    const expenses = [
        {
            title: "lunch",
            amount: 200,
            category: "food"
        },
        {
            title: "Bus",
            amount: 50,
            category: "Travel"
          }
        ];
    
        return res.status(200).json(expenses);
});

connectDB();