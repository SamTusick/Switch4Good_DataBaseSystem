# React + PostgreSQL Full Stack App

A full-stack application with React frontend and Node.js/Express backend connected to PostgreSQL.

## Project Structure

```
project/
├── backend/           # Express API server
│   ├── db.js         # PostgreSQL connection
│   ├── server.js     # API endpoints
│   ├── .env          # Database credentials (edit this!)
│   └── init.sql      # SQL to create sample table
│
└── frontend/         # React application
    └── src/
        └── App.jsx   # Main React component
```

## Setup Instructions

### 1. Configure PostgreSQL in pgAdmin

1. Open **pgAdmin**
2. Create a new database (or use an existing one)
3. Open the **Query Tool** and run the contents of `backend/init.sql` to create the sample table

### 2. Configure Backend

1. Open `backend/.env` and update with your PostgreSQL credentials:

   ```
   DB_USER=postgres
   DB_PASSWORD=your_actual_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=your_database_name
   ```

2. Install dependencies and start the server:

   ```bash
   cd backend
   npm install
   npm start
   ```

   The API will run on **http://localhost:5000**

### 3. Start Frontend

1. Open a new terminal and run:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. Open **http://localhost:3000** in your browser

## API Endpoints

| Method | Endpoint         | Description              |
| ------ | ---------------- | ------------------------ |
| GET    | `/api/test-db`   | Test database connection |
| GET    | `/api/items`     | Get all items            |
| GET    | `/api/items/:id` | Get single item          |
| POST   | `/api/items`     | Create new item          |
| PUT    | `/api/items/:id` | Update item              |
| DELETE | `/api/items/:id` | Delete item              |

## Troubleshooting

- **"Cannot connect to backend server"** - Make sure the backend is running (`npm start` in backend folder)
- **"Items table doesn't exist"** - Run `init.sql` in pgAdmin
- **Database connection error** - Check your `.env` credentials match pgAdmin
