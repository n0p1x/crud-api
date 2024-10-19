import { uuidv4 } from "./utils.js";

export interface User {
  age: number;
  hobbies: string[];
  id: string;
  username: string;
}

class UserRepository {
  private users: User[] = [];

  create(user: Omit<User, "id">): User {
    const newUser = { ...user, id: uuidv4() };
    this.users.push(newUser);
    return newUser;
  }

  delete(id: string): boolean {
    const initialLength = this.users.length;
    this.users = this.users.filter((user) => user.id !== id);
    return this.users.length !== initialLength;
  }

  getAll(): User[] {
    return this.users;
  }

  getById(id: string): undefined | User {
    return this.users.find((user) => user.id === id);
  }

  update(id: string, userData: Partial<User>): undefined | User {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex === -1) return undefined;

    this.users[userIndex] = { ...this.users[userIndex], ...userData };
    return this.users[userIndex];
  }
}

export default new UserRepository();
