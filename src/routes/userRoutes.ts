import { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import { uuidValidateV4 } from "../utils.js";
import usersDB, { User } from "../models/user.js";

export function handleUserRoutes(
  req: IncomingMessage,
  res: ServerResponse,
): void {
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  const id = url.pathname.split("/")[3];

  switch (req.method) {
    case "GET":
      if (id) {
        getUserById(id, res);
      } else {
        getAllUsers(res);
      }
      break;
    case "POST":
      createUser(req, res);
      break;
    case "PUT":
      updateUser(id, req, res);
      break;
    case "DELETE":
      deleteUser(id, res);
      break;
    default:
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Method Not Allowed" }));
  }
}

function getAllUsers(res: ServerResponse): void {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(usersDB.getAll()));
}

function getUserById(id: string, res: ServerResponse): void {
  if (!uuidValidateV4(id)) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Invalid user ID" }));
    return;
  }

  const user = usersDB.getById(id);
  if (!user) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "User not found" }));
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(user));
}

function createUser(req: IncomingMessage, res: ServerResponse): void {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  req.on("end", () => {
    try {
      const {
        username = undefined,
        age = undefined,
        hobbies = undefined,
      } = JSON.parse(body);
      if (!username || !age || !hobbies) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Missing required fields" }));
        return;
      }
      const newUser = usersDB.create({
        username,
        age,
        hobbies: Array.isArray(hobbies) ? hobbies : [],
      });
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify(newUser));
    } catch (error) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Invalid JSON" }));
    }
  });
}

function updateUser(
  id: string,
  req: IncomingMessage,
  res: ServerResponse,
): void {
  if (!uuidValidateV4(id)) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Invalid user ID" }));
    return;
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  req.on("end", () => {
    try {
      const {
        username = undefined,
        age = undefined,
        hobbies = undefined,
      } = JSON.parse(body);
      if (!username || !age || !hobbies) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Missing required fields" }));
        return;
      }
      const updatedUser: User = {
        id,
        username,
        age,
        hobbies: Array.isArray(hobbies) ? hobbies : [],
      };
      const result = usersDB.update(id, updatedUser);
      if (!result) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "User not found" }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(updatedUser));
    } catch (error) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Invalid JSON" }));
    }
  });
}

function deleteUser(id: string, res: ServerResponse): void {
  if (!uuidValidateV4(id)) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Invalid user ID" }));
    return;
  }

  const result = usersDB.delete(id);
  if (!result) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "User not found" }));
    return;
  }

  res.writeHead(204);
  res.end();
}
