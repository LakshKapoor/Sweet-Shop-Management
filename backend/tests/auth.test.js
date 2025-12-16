const request = require("supertest");
const app = require("../index");

describe("User Registration", () => {
    it("should fail when no email or password is provided", async () => {
        const res = await request(app).post("/api/auth/register").send({});
        expect(res.status).toBe(400);
    });

    it("should succeed when email and password are provided", async () => {
        const res = await request(app).post("/api/auth/register")
        .send({email: "test@example.com", password: "password123"
    
        });
    
         expect(res.status).toBe(201);
    
        expect(res.body.message).toBe("User registered successfully (mock)");
    });
});

describe("User Login", () => {
    it("should fail when email or password is missing",async ()=>{
        const res = await request(app).post("/api/auth/login").send({    
        });
        expect(res.status).toBe(400)
    });

    it("should fail when credentials are invalid",async ()=>{
        const res = await request(app).post("/api/auth/login")
        .send({email: "wrong@example.com", password: "wrongpassword"

        });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid Credentials");
});

it("should succeed when credentials are valid",async ()=>{
    const res = await request(app).post("/api/auth/login")
    .send({email: "test@example.com", password: "password123"

    });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Login successful (mock)");
});
});