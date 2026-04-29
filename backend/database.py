import sqlite3
import os
from threading import local

_db_local = local()
DB_PATH = os.environ.get('DATABASE_PATH', 'money_tracker.db')

def get_db():
    """Get thread-local database connection"""
    if not hasattr(_db_local, 'db'):
        _db_local.db = sqlite3.connect(DB_PATH, timeout=20)  # timeout is key!
        _db_local.db.row_factory = sqlite3.Row
        # Enable WAL mode for better concurrency
        _db_local.db.execute('PRAGMA journal_mode=WAL')
    return _db_local.db

def close_db(error=None):
    """Close connection when request ends"""
    if hasattr(_db_local, 'db'):
        _db_local.db.close()
        delattr(_db_local, 'db')

def init_db():
    """Create all tables - same as your original"""
    conn = sqlite3.connect(DB_PATH, timeout=20)
    conn.row_factory = sqlite3.Row
    
    # Your EXACT table creation code
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            currency TEXT DEFAULT '₹',
            salary REAL DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            balance REAL DEFAULT 0,
            credit_limit REAL DEFAULT 0,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            budget REAL DEFAULT 0,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            item TEXT NOT NULL,
            amount REAL NOT NULL,
            quantity REAL DEFAULT 1,
            unit_price REAL DEFAULT 0,
            category_id INTEGER,
            account_id INTEGER,
            date TEXT NOT NULL,
            notes TEXT,
            type TEXT DEFAULT 'expense',
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(category_id) REFERENCES categories(id),
            FOREIGN KEY(account_id) REFERENCES accounts(id)
        );

        CREATE TABLE IF NOT EXISTS income_sources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            frequency TEXT DEFAULT 'monthly',
            account_id INTEGER,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS recurring (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            frequency TEXT DEFAULT 'monthly',
            account_id INTEGER,
            next_date TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS savings_goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            target REAL NOT NULL,
            saved REAL DEFAULT 0,
            deadline TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS emis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            principal REAL NOT NULL,
            emi_amount REAL NOT NULL,
            remaining_months INTEGER NOT NULL,
            account_id INTEGER,
            due_date INTEGER DEFAULT 1,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    ''')
    
    conn.commit()
    conn.close()

def seed_defaults(user_id, salary=0):
    """Your exact seed function - unchanged"""
    conn = get_db()
    c = conn.cursor()
    categories = [
        ('Food & Dining', 5000), ('Transportation', 3000), ('Shopping', 4000),
        ('Entertainment', 2000), ('Bills & Utilities', 8000), ('Healthcare', 2000),
        ('Education', 3000), ('Other', 2000)
    ]
    for name, budget in categories:
        c.execute('INSERT INTO categories (user_id, name, budget) VALUES (?,?,?)', (user_id, name, budget))
    accounts = [
        ('Cash', 'cash', 0, 0),
        ('Bank Account', 'bank', 0, 0)
    ]
    for name, typ, bal, lim in accounts:
        c.execute('INSERT INTO accounts (user_id, name, type, balance, credit_limit) VALUES (?,?,?,?,?)',
                  (user_id, name, typ, bal, lim))
    bank_id = c.lastrowid
    c.execute('INSERT INTO income_sources (user_id, name, amount, frequency, account_id) VALUES (?,?,?,?,?)',
              (user_id, 'Salary', salary, 'monthly', bank_id))
    conn.commit()