# CRUD API

A simple CRUD API implementation using Node.js with TypeScript, featuring in-memory database and cluster mode support.

## Features

- RESTful API endpoints for user management
- In-memory database with shared state across workers
- Cluster mode support with load balancing
- TypeScript implementation
- Comprehensive error handling
- API tests

## Prerequisites

- Node.js v22.x.x or higher
- npm (comes with Node.js)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd crud-api
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

## Environment Variables

- `PORT` - Port number for the server (default: 4000)
- `CLUSTER_MODE` - Enable/disable cluster mode (true/false)

## Running the Application

### Development Mode
Runs the application with hot-reload using nodemon:
```bash
npm run start:dev
```

### Production Mode
Builds and runs the optimized production version:
```bash
npm run start:prod
```

### Cluster Mode
Runs multiple instances with load balancing:
```bash
npm run start:multi
```

## API Endpoints

### GET /api/users
- Returns all users
- Response: `200 OK` with array of users

### GET /api/users/{userId}
- Returns user by ID
- Response:
  - `200 OK` with user object
  - `400 Bad Request` if ID is invalid
  - `404 Not Found` if user doesn't exist

### POST /api/users
- Creates new user
- Request body:
```json
{
    "username": "string",
    "age": number,
    "hobbies": ["string"]
}
```
- Response:
  - `201 Created` with created user
  - `400 Bad Request` if required fields are missing

### PUT /api/users/{userId}
- Updates existing user
- Request body: same as POST
- Response:
  - `200 OK` with updated user
  - `400 Bad Request` if ID is invalid
  - `404 Not Found` if user doesn't exist

### DELETE /api/users/{userId}
- Deletes user by ID
- Response:
  - `204 No Content` on success
  - `400 Bad Request` if ID is invalid
  - `404 Not Found` if user doesn't exist

## Testing

Run the test suite:
```bash
npm test
```

## Additional Scripts

- `npm run build` - Build the TypeScript code
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically

## User Object Structure

```typescript
{
  id: string;       // UUID v4
  username: string; // Required
  age: number;      // Required
  hobbies: string[]; // Required
}
```

## Architecture Notes

- Uses in-memory database with `SharedArrayBuffer` for cluster mode
- Implements load balancing using Round-robin algorithm
- Supports horizontal scaling with worker processes
- Handles different types of errors with appropriate status codes
- Uses TypeScript for type safety
