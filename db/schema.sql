-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  role TEXT
);

-- Projects table
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name TEXT,
  description TEXT,
  owner_id INT REFERENCES users(id)
);

-- Tasks table
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id),
  title TEXT,
  completed BOOLEAN DEFAULT FALSE
);
