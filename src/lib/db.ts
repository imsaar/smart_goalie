import "server-only";
import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs/promises'; // Use promise-based fs

let dbInstance: Database | null = null;
let dbInitializationPromise: Promise<Database> | null = null;

const dbPath = path.resolve(process.cwd(), 'data', 'smart_goals.db');

async function initializeSchema(db: Database): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      email TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS Goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      specific TEXT,
      motivating TEXT,
      attainable TEXT,
      relevant TEXT,
      trackable_metrics TEXT,
      status TEXT DEFAULT 'pending',
      level TEXT,
      due_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      executor_id INTEGER,
      parent_goal_id INTEGER,
      llm_feedback TEXT,
      organization_context TEXT,
      FOREIGN KEY (executor_id) REFERENCES Users(id) ON DELETE SET NULL,
      FOREIGN KEY (parent_goal_id) REFERENCES Goals(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS GoalCollaborators (
      goal_id INTEGER,
      user_id INTEGER,
      PRIMARY KEY (goal_id, user_id),
      FOREIGN KEY (goal_id) REFERENCES Goals(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS GoalProgressUpdates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal_id INTEGER,
      update_description TEXT NOT NULL,
      progress_percentage INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (goal_id) REFERENCES Goals(id) ON DELETE CASCADE
    );

    CREATE TRIGGER IF NOT EXISTS update_goal_updated_at
    AFTER UPDATE ON Goals
    FOR EACH ROW
    BEGIN
      UPDATE Goals SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
  `);
  console.log('Database tables initialized successfully.');
}

async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }
  if (dbInitializationPromise) {
    return dbInitializationPromise;
  }

  dbInitializationPromise = (async () => {
    try {
      const dataDir = path.resolve(process.cwd(), 'data');
      await fs.mkdir(dataDir, { recursive: true });
      
      console.log(`Opening database at: ${dbPath}`);
      const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });
      console.log('Connected to the SQLite database.');
      await initializeSchema(db);
      dbInstance = db;
      return dbInstance;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      dbInitializationPromise = null; // Reset promise so next attempt can retry
      throw error; // Re-throw to be caught by caller
    }
  })();
  return dbInitializationPromise;
}

// User Management
export async function findOrCreateUserByName(name?: string | null): Promise<number | undefined> {
  if (!name || name.trim() === "") {
    return undefined;
  }
  const trimmedName = name.trim();
  const db = await getDb();

  try {
    let user = await db.get('SELECT id FROM Users WHERE name = ? COLLATE NOCASE', trimmedName);
    if (user) {
      return user.id;
    } else {
      const result = await db.run('INSERT INTO Users (name) VALUES (?)', trimmedName);
      if (result.lastID) {
        console.log(`User "${trimmedName}" created with ID: ${result.lastID}`);
        return result.lastID;
      }
      throw new Error('User creation failed, no lastID returned.');
    }
  } catch (error: any) {
     // Handle potential UNIQUE constraint failure more robustly if COLLATE NOCASE isn't perfect
    if (error.message && error.message.includes('UNIQUE constraint failed: Users.name')) {
        console.warn(`Attempted to create user "${trimmedName}" but a user with that name (case-sensitive) likely already exists.`);
        const existingUser = await db.get('SELECT id FROM Users WHERE name = ?', trimmedName);
        if (existingUser) return existingUser.id;
    }
    console.error(`Error in findOrCreateUserByName for "${trimmedName}":`, error);
    throw error; // Re-throw
  }
}

// User Management
export interface User {
  id: number;
  name: string;
  email?: string | null;
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDb();
  try {
    return await db.all('SELECT id, name, email FROM Users ORDER BY name ASC');
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
}

// Goal Management
export interface GoalInputData {
  title: string;
  description?: string;
  specific?: string;
  motivating?: string;
  attainable?: string;
  relevant?: string;
  trackable_metrics?: string;
  level?: 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'five_year' | string;
  due_date?: string;
  executor_name?: string | null;
  parent_goal_id?: number | null;
  organization_context?: string;
  status?: string;
  llm_feedback?: string;
}

export async function addGoal(goalData: GoalInputData): Promise<number | undefined> {
  const { title, description, specific, motivating, attainable, relevant, trackable_metrics, level, due_date, executor_name, parent_goal_id, organization_context } = goalData;
  const db = await getDb();

  try {
    const executor_id = await findOrCreateUserByName(executor_name);
    const sql = `INSERT INTO Goals (title, description, specific, motivating, attainable, relevant, trackable_metrics, level, due_date, executor_id, parent_goal_id, organization_context, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [title, description, specific, motivating, attainable, relevant, trackable_metrics, level, due_date, executor_id, parent_goal_id, organization_context, goalData.status || 'pending'];
    const result = await db.run(sql, params);
    return result.lastID;
  } catch (error) {
    console.error('Error adding goal:', error);
    throw error;
  }
}

export async function getGoalById(id: number): Promise<any | undefined> {
  const db = await getDb();
  const sql = `
    SELECT G.*, U.name as executor_name
    FROM Goals G
    LEFT JOIN Users U ON G.executor_id = U.id
    WHERE G.id = ?
  `;
  try {
    return await db.get(sql, id);
  } catch (error) {
    console.error('Error fetching goal by ID:', error);
    throw error;
  }
}

export async function getAllGoals(): Promise<any[]> {
  const db = await getDb();
  const sql = `
    SELECT G.*, U.name as executor_name
    FROM Goals G
    LEFT JOIN Users U ON G.executor_id = U.id
    ORDER BY G.due_date ASC, G.created_at DESC
  `;
  try {
    return await db.all(sql);
  } catch (error) {
    console.error('Error fetching all goals:', error);
    throw error;
  }
}

export async function updateGoal(id: number, goalData: GoalInputData): Promise<boolean> {
  const { title, description, specific, motivating, attainable, relevant, trackable_metrics, status, level, due_date, executor_name, parent_goal_id, llm_feedback, organization_context } = goalData;
  const db = await getDb();
  try {
    const executor_id = await findOrCreateUserByName(executor_name);
    const sql = `UPDATE Goals SET
                  title = ?, description = ?, specific = ?, motivating = ?, attainable = ?, relevant = ?,
                  trackable_metrics = ?, status = ?, level = ?, due_date = ?, executor_id = ?,
                  parent_goal_id = ?, llm_feedback = ?, organization_context = ?
                 WHERE id = ?`;
    const params = [
        title, description, specific, motivating, attainable, relevant, trackable_metrics, 
        status || 'pending', level, due_date, executor_id, parent_goal_id, llm_feedback, organization_context, 
        id
    ];
    const result = await db.run(sql, params);
    return (result.changes ?? 0) > 0;
  } catch (error) {
    console.error('Error updating goal:', error);
    throw error;
  }
}

export async function deleteGoal(id: number): Promise<boolean> {
  const db = await getDb();
  const sql = `DELETE FROM Goals WHERE id = ?`;
  try {
    const result = await db.run(sql, id);
    // CASCADE should handle GoalCollaborators and GoalProgressUpdates
    return (result.changes ?? 0) > 0;
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
}

// Note: The default export 'db' is removed as direct access to the instance is now managed by getDb().
// If other parts of the application were importing 'db' directly, they should be updated
// or this file should export 'getDb' for them to use.
// For now, only the specific CRUD functions are exported.
