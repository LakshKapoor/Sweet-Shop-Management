const request = require("supertest");
const app = require("../index");

describe("User Registration", () => {
    it("should fail when no email or password is provided", async () => {
        const res = await request(app).post("/api/auth/register").send({});
        expect(res.status).toBe(400);
    });
});