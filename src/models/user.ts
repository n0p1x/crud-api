import { uuidv4 } from "../utils.js";

export interface User {
  id: string;
  username: string;
  age: number;
  hobbies: string[];
}

class UserModel {
  private users: User[] = [];

  getAll(): User[] {
    return this.users;
  }

  getById(id: string): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  create(user: Omit<User, "id">): User {
    const newUser = { ...user, id: uuidv4() };
    this.users.push(newUser);
    return newUser;
  }

  update(id: string, userData: Partial<User>): User | undefined {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex === -1) return undefined;

    this.users[userIndex] = { ...this.users[userIndex], ...userData };
    return this.users[userIndex];
  }

  delete(id: string): boolean {
    const initialLength = this.users.length;
    this.users = this.users.filter((user) => user.id !== id);
    return this.users.length !== initialLength;
  }
}

export default new UserModel();
