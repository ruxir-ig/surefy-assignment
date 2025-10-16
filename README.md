# Event Management System - Surefy Assignment

A robust RESTful API for managing events and user registrations built with Express.js, TypeScript, PostgreSQL, and Bun runtime.

## Features

- **Event Management**: Create and retrieve event details
- **User Registration**: Register users for events with capacity validation
- **Registration Management**: Cancel registrations
- **Event Statistics**: Get real-time statistics about event registrations
- **Upcoming Events**: Retrieve all upcoming events sorted by date and location
- **Concurrency Control**: Transaction-based registration to prevent overbooking
- **Data Validation**: Comprehensive input validation and error handling

## Tech Stack

- **Runtime**: [Bun](https://bun.sh) v1.3.0
- **Framework**: Express.js v5.1.0
- **Database**: PostgreSQL
- **Language**: TypeScript
- **Environment Management**: dotenv

## Prerequisites

- [Bun](https://bun.sh) installed
- PostgreSQL installed and running
- Node.js (for TypeScript support)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ruxir-ig/surefy-assignment.git
   cd surefy-assignment
   ```

2. **Install dependencies**
   ```bash
   bun i
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   DB_USER=eventuser
   DB_HOST=localhost
   DB_NAME=eventdb
   DB_PASSWORD=event123
   DB_PORT=5432
   ```

4. **Set up the database**
   
   Connect to PostgreSQL and create the database:
   ```bash
   psql -U postgres
   ```
   
   Then run:
   ```sql
   CREATE DATABASE eventdb;
   CREATE USER eventuser WITH PASSWORD 'event123';
   GRANT ALL PRIVILEGES ON DATABASE eventdb TO eventuser;
   \c eventdb
   GRANT ALL ON SCHEMA public TO eventuser;
   ```

5. **Create database tables**
   ```sql
   -- Events table
   CREATE TABLE events (
     id SERIAL PRIMARY KEY,
     title VARCHAR(255) NOT NULL,
     datetime TIMESTAMP NOT NULL,
     location VARCHAR(255) NOT NULL,
     capacity INTEGER NOT NULL CHECK (capacity > 0 AND capacity <= 1000)
   );

   -- Users table (for testing)
   CREATE TABLE users (
     id SERIAL PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     email VARCHAR(255) UNIQUE NOT NULL
   );

   -- Registrations table
   CREATE TABLE registrations (
     id SERIAL PRIMARY KEY,
     event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
     user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
     registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     UNIQUE(event_id, user_id)
   );

   -- Insert sample user for testing
   INSERT INTO users (name, email) VALUES 
     ('John Doe', 'john@example.com'),
     ('Jane Smith', 'jane@example.com');
   ```

## Running the Application

Start the server:
```bash
bun run src/server.ts
```

The server will start on `http://localhost:3000`

## API Documentation

### Base URL
```
http://localhost:3000
```

---

### 1. Create Event
**POST** `/events`

Create a new event with title, datetime, location, and capacity.

**Request Body:**
```json
{
  "title": "Tech Conference 2025",
  "datetime": "2025-11-01T10:00:00Z",
  "location": "New York",
  "capacity": 100
}
```

**Validation Rules:**
- All fields are required
- Capacity must be between 0 and 1000

**Success Response (201):**
```json
{
  "message": "Event is created successfully",
  "eventId": 1
}
```

**Error Responses:**
- `400`: Missing required fields or invalid capacity
- `500`: Internal server error

---

### 2. Get Event Details
**GET** `/events/:id`

Retrieve detailed information about a specific event including all registered users.

**Example Request:**
```bash
curl http://localhost:3000/events/1
```

**Success Response (200):**
```json
{
  "id": 1,
  "title": "Tech Conference 2025",
  "datetime": "2025-11-01T10:00:00.000Z",
  "location": "New York",
  "capacity": 100,
  "registeredUsers": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  ]
}
```

**Error Responses:**
- `404`: Event not found
- `500`: Internal server error

---

### 3. Register for Event
**POST** `/events/:id/register`

Register a user for a specific event. Uses database transactions to prevent race conditions and overbooking.

**Request Body:**
```json
{
  "userId": 1
}
```

**Success Response (201):**
```json
{
  "message": "Successfully registered for event"
}
```

**Error Responses:**
- `400`: 
  - Missing userId
  - User already registered for this event
  - Cannot register for past events
  - Event is full
- `404`: Event not found
- `500`: Internal server error

**Features:**
- ✅ Prevents duplicate registrations
- ✅ Validates event capacity
- ✅ Blocks registration for past events
- ✅ Uses row-level locking to prevent race conditions

---

### 4. Cancel Registration
**POST** `/events/:id/cancel`

Cancel a user's registration for an event.

**Request Body:**
```json
{
  "userId": 1
}
```

**Success Response (200):**
```json
{
  "message": "Registration cancelled successfully"
}
```

**Error Responses:**
- `400`: Missing userId
- `404`: Registration not found
- `500`: Internal server error

---

### 5. Get Upcoming Events
**GET** `/events/upcoming`

Retrieve all upcoming events sorted by datetime (ascending) and location (ascending).

**Example Request:**
```bash
curl http://localhost:3000/events/upcoming
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "title": "Tech Conference 2025",
    "datetime": "2025-11-01T10:00:00.000Z",
    "location": "New York",
    "capacity": 100,
    "registration_count": "3"
  },
  {
    "id": 2,
    "title": "AI Workshop",
    "datetime": "2025-12-15T14:00:00.000Z",
    "location": "Boston",
    "capacity": 50,
    "registration_count": "0"
  }
]
```

**Error Responses:**
- `500`: Internal server error

---

### 6. Get Event Statistics
**GET** `/events/:id/stats`

Get registration statistics for a specific event.

**Example Request:**
```bash
curl http://localhost:3000/events/1/stats
```

**Success Response (200):**
```json
{
  "totalRegistrations": 3,
  "remainingCapacity": 97,
  "percentageUsed": 3
}
```

**Error Responses:**
- `404`: Event not found
- `500`: Internal server error

---

## Testing the API

You can test the API using `curl`:

```bash
# Create an event
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tech Conference",
    "datetime": "2025-11-01T10:00:00Z",
    "location": "New York",
    "capacity": 100
  }'

# Get event details
curl http://localhost:3000/events/1

# Register for event
curl -X POST http://localhost:3000/events/1/register \
  -H "Content-Type: application/json" \
  -d '{"userId": 1}'

# Get event stats
curl http://localhost:3000/events/1/stats

# Get upcoming events
curl http://localhost:3000/events/upcoming

# Cancel registration
curl -X POST http://localhost:3000/events/1/cancel \
  -H "Content-Type: application/json" \
  -d '{"userId": 1}'
```

## Project Structure

```
surefy-assignment/
├── src/
│   ├── server.ts              # Application entry point
│   ├── controllers/
│   │   └── eventsController.ts  # Event business logic
│   ├── routes/
│   │   └── events.ts           # Route definitions
│   └── db/
│       └── index.ts            # Database connection
├── package.json
├── tsconfig.json
├── .env                        # Environment variables (not in repo)
└── README.md
```

## Security Features

- Input validation on all endpoints
- SQL injection prevention using parameterized queries
- Transaction-based concurrency control
- Environment variable configuration
- Error handling without exposing sensitive information

## Error Handling

All endpoints include comprehensive error handling:
- **400 Bad Request**: Invalid input or business logic violations
- **404 Not Found**: Resource doesn't exist
- **500 Internal Server Error**: Unexpected server errors

## Database Schema

### Events Table
- `id`: Auto-incrementing primary key
- `title`: Event name (VARCHAR 255)
- `datetime`: Event date and time (TIMESTAMP)
- `location`: Event location (VARCHAR 255)
- `capacity`: Maximum attendees (INTEGER, 1-1000)

### Users Table
- `id`: Auto-incrementing primary key
- `name`: User's full name (VARCHAR 255)
- `email`: Unique email address (VARCHAR 255)

### Registrations Table
- `id`: Auto-incrementing primary key
- `event_id`: Foreign key to events
- `user_id`: Foreign key to users
- `registered_at`: Registration timestamp
- Unique constraint on (event_id, user_id)

---

**Note**: This project was created using `bun init` in bun v1.3.0. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
