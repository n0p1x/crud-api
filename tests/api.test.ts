import http from "node:http";
import { test, describe, before, after, it } from "node:test";
import assert from "node:assert/strict";
import { createHttpServer } from "../src/server.js";
import { uuidv4 } from "../src/utils.js";

function request(
  options: http.RequestOptions,
  data?: any,
): Promise<{ statusCode: number; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk.toString()));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode!,
          body: body ? JSON.parse(body) : null,
        });
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

describe("User API", () => {
  let userId: string;
  let serverPort: number;
  let serverInstance: ReturnType<typeof createHttpServer>;

  before(() => {
    serverInstance = createHttpServer();
    return new Promise<void>((resolve) => {
      serverInstance.server.listen(0, () => {
        serverPort = (serverInstance.server.address() as any).port;
        resolve();
      });
    });
  });

  after(() => {
    return serverInstance.stop();
  });

  test("CRUD operations", async () => {
    const newUser = {
      username: "John Doe",
      age: 30,
      hobbies: ["reading", "cycling"],
    };

    // Create
    const createRes = await request(
      {
        hostname: "localhost",
        port: serverPort,
        path: "/api/users",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      newUser,
    );

    assert.equal(createRes.statusCode, 201);
    assert.ok(createRes.body.id);
    userId = createRes.body.id;

    // Read
    const readRes = await request({
      hostname: "localhost",
      port: serverPort,
      path: `/api/users/${userId}`,
      method: "GET",
    });

    assert.equal(readRes.statusCode, 200);
    assert.equal(readRes.body.username, newUser.username);

    // Update
    const updateUser = {
      username: "Jane Doe",
      age: 31,
      hobbies: ["swimming"],
    };

    const updateRes = await request(
      {
        hostname: "localhost",
        port: serverPort,
        path: `/api/users/${userId}`,
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      },
      updateUser,
    );

    assert.equal(updateRes.statusCode, 200);
    assert.equal(updateRes.body.username, updateUser.username);

    // Delete
    const deleteRes = await request({
      hostname: "localhost",
      port: serverPort,
      path: `/api/users/${userId}`,
      method: "DELETE",
    });

    assert.equal(deleteRes.statusCode, 204);

    // Verify deletion
    const verifyRes = await request({
      hostname: "localhost",
      port: serverPort,
      path: `/api/users/${userId}`,
      method: "GET",
    });

    assert.equal(verifyRes.statusCode, 404);
  });

  test("Error handling", async () => {
    // Invalid user ID
    const invalidIdRes = await request({
      hostname: "localhost",
      port: serverPort,
      path: "/api/users/invalid-id",
      method: "GET",
    });

    assert.equal(invalidIdRes.statusCode, 400);
    assert.equal(invalidIdRes.body.message, "Invalid user ID");

    // Non-existent user
    const nonExistentId = uuidv4();
    const nonExistentRes = await request({
      hostname: "localhost",
      port: serverPort,
      path: `/api/users/${nonExistentId}`,
      method: "GET",
    });

    assert.equal(nonExistentRes.statusCode, 404);
    assert.equal(nonExistentRes.body.message, "User not found");

    // Missing required fields
    const invalidUser = {
      username: "Test User",
      // Missing age and hobbies
    };

    const invalidUserRes = await request(
      {
        hostname: "localhost",
        port: serverPort,
        path: "/api/users",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      invalidUser,
    );

    assert.equal(invalidUserRes.statusCode, 400);
    assert.equal(invalidUserRes.body.message, "Missing required fields");
  });

  test("Get all users", async () => {
    // Create multiple users
    const users = [
      { username: "User 1", age: 25, hobbies: ["reading"] },
      { username: "User 2", age: 30, hobbies: ["sports"] },
    ];

    for (const user of users) {
      await request(
        {
          hostname: "localhost",
          port: serverPort,
          path: "/api/users",
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
        user,
      );
    }

    // Get all users
    const getAllRes = await request({
      hostname: "localhost",
      port: serverPort,
      path: "/api/users",
      method: "GET",
    });

    assert.equal(getAllRes.statusCode, 200);
    assert.ok(Array.isArray(getAllRes.body));
    assert.ok(getAllRes.body.length >= users.length);
  });
});
