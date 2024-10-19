import assert from "node:assert/strict";
import http from "node:http";
import { after, before, describe, test } from "node:test";

import { createHttpServer } from "../src/server.js";
import { uuidv4 } from "../src/utils.js";

type UserResponse = {
  age: number;
  hobbies: string[];
  id: string;
  username: string;
};

type ErrorResponse = {
  message: string;
};

function request(
  options: http.RequestOptions,
  data?: Record<string, unknown>,
): Promise<{
  body: ErrorResponse | null | UserResponse | UserResponse[];
  statusCode: number;
}> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk.toString()));
      res.on("end", () => {
        resolve({
          body: body ? JSON.parse(body) : null,
          statusCode: res.statusCode!,
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
        const address = serverInstance.server.address();
        if (address && typeof address === "object") {
          serverPort = address.port;
        }
        resolve();
      });
    });
  });

  after(() => {
    return serverInstance.stop();
  });

  test("CRUD operations", async () => {
    const newUser = {
      age: 30,
      hobbies: ["reading", "cycling"],
      username: "John Doe",
    };

    // Create
    const createRes = await request(
      {
        headers: { "Content-Type": "application/json" },
        hostname: "localhost",
        method: "POST",
        path: "/api/users",
        port: serverPort,
      },
      newUser,
    );

    assert.equal(createRes.statusCode, 201);
    assert.ok((createRes.body as UserResponse).id);
    userId = (createRes.body as UserResponse).id;

    // Read
    const readRes = await request({
      hostname: "localhost",
      method: "GET",
      path: `/api/users/${userId}`,
      port: serverPort,
    });

    assert.equal(readRes.statusCode, 200);
    assert.equal((readRes.body as UserResponse).username, newUser.username);

    // Update
    const updateUser = {
      age: 31,
      hobbies: ["swimming"],
      username: "Jane Doe",
    };

    const updateRes = await request(
      {
        headers: { "Content-Type": "application/json" },
        hostname: "localhost",
        method: "PUT",
        path: `/api/users/${userId}`,
        port: serverPort,
      },
      updateUser,
    );

    assert.equal(updateRes.statusCode, 200);
    assert.equal(
      (updateRes.body as UserResponse).username,
      updateUser.username,
    );

    // Delete
    const deleteRes = await request({
      hostname: "localhost",
      method: "DELETE",
      path: `/api/users/${userId}`,
      port: serverPort,
    });

    assert.equal(deleteRes.statusCode, 204);

    // Verify deletion
    const verifyRes = await request({
      hostname: "localhost",
      method: "GET",
      path: `/api/users/${userId}`,
      port: serverPort,
    });

    assert.equal(verifyRes.statusCode, 404);
  });

  test("Error handling", async () => {
    // Invalid user ID
    const invalidIdRes = await request({
      hostname: "localhost",
      method: "GET",
      path: "/api/users/invalid-id",
      port: serverPort,
    });

    assert.equal(invalidIdRes.statusCode, 400);
    assert.equal(
      (invalidIdRes.body as ErrorResponse).message,
      "Invalid user ID",
    );

    // Non-existent user
    const nonExistentId = uuidv4();
    const nonExistentRes = await request({
      hostname: "localhost",
      method: "GET",
      path: `/api/users/${nonExistentId}`,
      port: serverPort,
    });

    assert.equal(nonExistentRes.statusCode, 404);
    assert.equal(
      (nonExistentRes.body as ErrorResponse).message,
      "User not found",
    );

    // Missing required fields
    const invalidUser = {
      username: "Test User",
      // Missing age and hobbies
    };

    const invalidUserRes = await request(
      {
        headers: { "Content-Type": "application/json" },
        hostname: "localhost",
        method: "POST",
        path: "/api/users",
        port: serverPort,
      },
      invalidUser,
    );

    assert.equal(invalidUserRes.statusCode, 400);
    assert.equal(
      (invalidUserRes.body as ErrorResponse).message,
      "Missing required fields",
    );
  });

  test("Get all users", async () => {
    // Create multiple users
    const users = [
      { age: 25, hobbies: ["reading"], username: "User 1" },
      { age: 30, hobbies: ["sports"], username: "User 2" },
    ];

    for (const user of users) {
      await request(
        {
          headers: { "Content-Type": "application/json" },
          hostname: "localhost",
          method: "POST",
          path: "/api/users",
          port: serverPort,
        },
        user,
      );
    }

    // Get all users
    const getAllRes = await request({
      hostname: "localhost",
      method: "GET",
      path: "/api/users",
      port: serverPort,
    });

    assert.equal(getAllRes.statusCode, 200);
    assert.ok(Array.isArray(getAllRes.body));
    assert.ok(getAllRes.body.length >= users.length);
  });
});
