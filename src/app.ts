import dotenv from "dotenv";
import cluster from "node:cluster";
import os from "node:os";
import { join } from "node:path";
import { Worker } from "worker_threads";
import { createHttpServer } from "./server.js";
import { SharedDatabase } from "./userDatabase.js";
import { __dirname } from "./utils.js";

dotenv.config();

const CLUSTER_MODE = process.env.CLUSTER_MODE === "true";
const BASE_PORT = parseInt(process.env.PORT || "4000", 10);

if (CLUSTER_MODE) {
  if (cluster.isPrimary) {
    const numCPUs = os.cpus().length;
    const db = new SharedDatabase();

    console.log(`Primary ${process.pid} is running on port ${BASE_PORT}`);

    for (let i = 0; i < numCPUs; i++) {
      createClusterWorker(db, i);
    }

    cluster.on("exit", (worker, code, signal) => {
      console.log(
        `Worker ${worker.process.pid} died with code ${code} and signal ${signal}`,
      );
      createClusterWorker(db, worker.id - 1);
    });
  } else {
    const workerId = cluster.worker?.id ?? 0;
    const port = BASE_PORT + workerId - 1;
    createHttpServer().start(port);
  }
} else {
  createHttpServer().start(BASE_PORT);
}

function createClusterWorker(db: SharedDatabase, index: number) {
  const worker = cluster.fork({ WORKER_ID: index });
  let dbWorker: Worker | null = null;

  worker.on("online", () => {
    const workerPath = join(__dirname, "userDatabase.js");

    dbWorker = new Worker(workerPath, {
      workerData: { buffer: db.getBuffer() },
    });

    dbWorker.on("message", (msg) => {
      try {
        worker.send(msg);
      } catch (err) {
        console.error("Error sending message to worker:", err);
      }
    });

    dbWorker.on("error", (err) => {
      console.error("Thread worker error:", err);
    });

    dbWorker.on("exit", (code) => {
      console.log(`Thread worker exited with code ${code}`);
      if (code !== 0) {
        createClusterWorker(db, index);
      }
    });
  });

  worker.on("message", (msg) => {
    try {
      dbWorker?.postMessage(msg);
    } catch (err) {
      console.error("Error sending message to thread worker:", err);
    }
  });

  worker.on("error", (err) => {
    console.error("Cluster worker error:", err);
  });
}
