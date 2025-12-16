const request =  require("supertest");
const app = require("../index");


describe("Sweets API", () => {

    it("should return a list of sweets", async () => {
      const res = await request(app).get("/api/sweets");
  
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  
  });