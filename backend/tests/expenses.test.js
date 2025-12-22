const request = require("supertest")
const app = require("../index")

describe("Expense API", ()=>{

    it("should fail when title or amount is missing", async ()=>{
        const res = await request(app).post("/api/expenses")
        .send({});

        expect(res.status).toBe(400);
    });

    it("should create an expense when valid data is provided",async ()=>{
        const res = await request(app).post("/api/expenses")
        .send({
            title: "lunch",
            amount: 200,
            category: "Food"
        });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe("Expense added (mock)")
    });

    it("should return the expenses list", async ()=>{
        const res = await request(app).get("/api/expenses");

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});




