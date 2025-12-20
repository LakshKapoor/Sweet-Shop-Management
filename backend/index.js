const express = require("express");

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

