import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { User } from "./userRepository.js";
import { uuidv4 } from "./utils.js";

const MAX_USERS = 1000;
const USER_SIZE = 256;
const BUFFER_SIZE = MAX_USERS * USER_SIZE;

export class SharedDatabase {
  private buffer: SharedArrayBuffer;
  private view: Uint8Array;

  constructor() {
    this.buffer = new SharedArrayBuffer(BUFFER_SIZE);
    this.view = new Uint8Array(this.buffer);
  }

  private encodeUser(user: User): Uint8Array {
    const encoder = new TextEncoder();
    const data = JSON.stringify(user);
    const encoded = encoder.encode(data);
    const paddedArray = new Uint8Array(USER_SIZE);
    paddedArray.set(encoded);
    return paddedArray;
  }

  private decodeUser(data: Uint8Array): User | null {
    const decoder = new TextDecoder();
    const nullIndex = data.indexOf(0);
    const jsonString = decoder.decode(
      data.subarray(0, nullIndex !== -1 ? nullIndex : undefined),
    );
    try {
      return JSON.parse(jsonString);
    } catch {
      return null;
    }
  }

  set(user: User): void {
    const index = parseInt(user.id, 36) % MAX_USERS;
    const encodedUser = this.encodeUser(user);
    this.view.set(encodedUser, index * USER_SIZE);
  }

  get(id: string): User | undefined {
    const index = parseInt(id, 36) % MAX_USERS;
    const userData = this.view.slice(
      index * USER_SIZE,
      (index + 1) * USER_SIZE,
    );
    const user = this.decodeUser(userData);
    return user && user.id === id ? user : undefined;
  }

  getAll(): User[] {
    const users: User[] = [];
    for (let i = 0; i < MAX_USERS; i++) {
      const userData = this.view.slice(i * USER_SIZE, (i + 1) * USER_SIZE);
      const user = this.decodeUser(userData);
      if (user) users.push(user);
    }
    return users;
  }

  create(userData: Omit<User, "id">): User {
    const newUser = { ...userData, id: uuidv4() };
    this.set(newUser);
    return newUser;
  }

  update(id: string, userData: Partial<User>): User | undefined {
    const existingUser = this.get(id);
    if (!existingUser) return undefined;
    const updatedUser = { ...existingUser, ...userData, id };
    this.set(updatedUser);
    return updatedUser;
  }

  delete(id: string): boolean {
    const index = parseInt(id, 36) % MAX_USERS;
    const user = this.get(id);
    if (!user) return false;
    this.view.fill(0, index * USER_SIZE, (index + 1) * USER_SIZE);
    return true;
  }

  setBuffer(buffer: SharedArrayBuffer) {
    this.buffer = buffer;
    this.view = new Uint8Array(this.buffer);
  }

  getBuffer(): SharedArrayBuffer {
    return this.buffer;
  }
}

if (!isMainThread) {
  const { buffer } = workerData;
  const db = new SharedDatabase();
  db.setBuffer(buffer);

  parentPort?.on("message", ({ action, payload }) => {
    let result;
    switch (action) {
      case "getAll":
        result = db.getAll();
        break;
      case "get":
        result = db.get(payload.id);
        break;
      case "create":
        result = db.create(payload);
        break;
      case "update":
        result = db.update(payload.id, payload.data);
        break;
      case "delete":
        result = db.delete(payload.id);
        break;
    }
    parentPort?.postMessage({ action, result });
  });
}
