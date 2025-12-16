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