import http from "node:http";
import { URL } from "node:url";

import { routeUserRequests } from "./userController.js";

export function createHttpServer() {
  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url || "", `http://${req.headers.host}`);

      if (url.pathname.startsWith("/api/users")) {
        routeUserRequests(req, res);
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
    server,
    start: (port: number) => {
      server.listen(port, () => {
        console.log(`Worker ${process.pid} is running on port ${port}`);
      });
    },
    stop: () => {
      return new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    },
  };
}
