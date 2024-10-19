import http from "node:http";
import { URL } from "node:url";
import dotenv from "dotenv";
import { handleUserRoutes } from "./routes/userRoutes.js";

dotenv.config();

export function createServer() {
  const port = parseInt(process.env.PORT || "3000", 10);

  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url || "", `http://${req.headers.host}`);

      if (url.pathname.startsWith("/api/users")) {
        handleUserRoutes(req, res);
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Not Found" }));
      }
    } catch (error) {
      console.error("Server error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Internal Server Error" }));
    }
  });

  return {
    start: () => {
      server.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });
    },
    stop: () => {
      return new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    },
    server,
  };
}

// Start the server if this file is run directly
if (import.meta.url.startsWith("file:")) {
  console.log("Starting server...");
  const { start } = createServer();
  start();
}
