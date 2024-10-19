import { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import { isValidUUIDv4 } from "./utils.js";
import usersDB, { User } from "./userRepository.js";
import cluster from "node:cluster";

const isClusterMode = process.env.CLUSTER_MODE === "true";

function sendRequestToWorker(action: string, payload?: any): Promise<any> {
  return new Promise((resolve) => {
    process.send?.({ action, payload });
    process.once("message", (msg: any) => {
      if (msg.action === action) {
        resolve(msg.result);
      }
    });
  });
}

export function routeUserRequests(
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

async function getAllUsers(res: ServerResponse): Promise<void> {
  let users;
  if (isClusterMode && !cluster.isPrimary) {
    users = await sendRequestToWorker("getAll");
  } else {
    users = usersDB.getAll();
  }
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(users));
}

async function getUserById(id: string, res: ServerResponse): Promise<void> {
  if (!isValidUUIDv4(id)) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Invalid user ID" }));
    return;
  }

  let user;
  if (isClusterMode && !cluster.isPrimary) {
    user = await sendRequestToWorker("get", { id });
  } else {
    user = usersDB.getById(id);
  }

  if (!user) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "User not found" }));
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(user));
}

async function createUser(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  req.on("end", async () => {
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
      const userData = {
        username,
        age,
        hobbies: Array.isArray(hobbies) ? hobbies : [],
      };
      let newUser;
      if (isClusterMode && !cluster.isPrimary) {
        newUser = await sendRequestToWorker("create", userData);
      } else {
        newUser = usersDB.create(userData);
      }
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify(newUser));
    } catch (error) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Invalid JSON" }));
    }
  });
}

async function updateUser(
  id: string,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (!isValidUUIDv4(id)) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Invalid user ID" }));
    return;
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  req.on("end", async () => {
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
      const updatedUserData: User = {
        id,
        username,
        age,
        hobbies: Array.isArray(hobbies) ? hobbies : [],
      };
      let result;
      if (isClusterMode && !cluster.isPrimary) {
        result = await sendRequestToWorker("update", {
          id,
          data: updatedUserData,
        });
      } else {
        result = usersDB.update(id, updatedUserData);
      }
      if (!result) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "User not found" }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
    } catch (error) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Invalid JSON" }));
    }
  });
}

async function deleteUser(id: string, res: ServerResponse): Promise<void> {
  if (!isValidUUIDv4(id)) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Invalid user ID" }));
    return;
  }

  let result;
  if (isClusterMode && !cluster.isPrimary) {
    result = await sendRequestToWorker("delete", { id });
  } else {
    result = usersDB.delete(id);
  }

  if (!result) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "User not found" }));
    return;
  }

  res.writeHead(204);
  res.end();
}
