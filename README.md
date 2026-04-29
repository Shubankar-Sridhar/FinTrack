# FinTrack - Personal Finance Manager

This web application is a complete personal finance tracking application that helps users manage expenses, income, savings goals, EMIs, and recurring payments with visually detailed analytics.

## Live Demo

Link: 

---

## Tech Stack

### Backend
| Tool | Purpose | Justification |
|------|---------|---------------|
| **Flask 2.3.3** | Web framework | Lightweight, easy to implement REST APIs, perfect for small to medium applications |
| **SQLite3** | Database | Zero-configuration, file-based, ACID compliant, sufficient for personal finance app |
| **SHA256 Hashing** | Password security | One-way encryption, industry standard, prevents password theft even if database is compromised |
| **python-dateutil** | Date manipulation | Handles recurring date calculations (weekly/monthly/yearly intervals) reliably |
| **Gunicorn** | Production server | WSGI HTTP server for production, handles concurrent requests efficiently |

### Frontend
| Tool | Purpose | Justification |
|------|---------|---------------|
| **React 18** | UI framework | Component-based architecture, efficient rendering with virtual DOM |
| **Vite** | Build tool | Fast hot reload, optimized production builds, modern ES modules support |
| **Chart.js** | Data visualization | Lightweight, responsive charts for analytics dashboard |
| **react-chartjs-2** | React wrapper | Seamless integration of Chart.js with React components |

### Security Features
- **SHA256 Password Hashing**: Passwords are never stored in plain text
- **Session Management**: Flask sessions for authenticated routes
- **SQL Injection Prevention**: Parameterized queries throughout
- **CORS Ready**: Can be configured for production domains

---

## Backend API Routes

### Authentication (`/api/auth/*`)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/register` | Create new user | `{name, email, password, currency, salary}` | `{success, name, id}` |
| POST | `/login` | Authenticate user | `{email, password}` | `{success, name, id, currency}` |
| POST | `/logout` | End session | - | `{success}` |
| GET | `/me` | Get current user | - | `{authenticated, user}` |

### User Settings (`/api/settings`)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| PUT | `/` | Update user profile | `{name, salary, currency}` | `{success}` |

### Categories (`/api/categories`)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/` | Get all categories | - | `[{id, name, budget}]` |
| POST | `/` | Add new category | `{name, budget}` | `{id, name, budget}` |
| DELETE | `/<id>` | Delete category | - | `{success}` |

### Accounts (`/api/accounts`)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/` | Get all accounts | - | `[{id, name, type, balance, credit_limit}]` |
| POST | `/` | Add new account | `{name, type, balance, credit_limit}` | `{id}` |
| DELETE | `/<id>` | Delete account | - | `{success}` |
| POST | `/transfer` | Transfer between accounts | `{from_id, to_id, amount}` | `{success}` |

### Expenses (`/api/expenses`)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/` | Get all expenses | - | `[{id, item, amount, date, category_name, ...}]` |
| POST | `/` | Add new expense | `{item, amount, account_id, date, category_id, notes}` | `{id}` |
| DELETE | `/<id>` | Delete expense | - | `{success}` |

### Income Sources (`/api/income`)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/` | Get all income sources | - | `[{id, name, amount, frequency, account_id}]` |
| POST | `/` | Add income source | `{name, amount, frequency, account_id}` | `{id}` |
| POST | `/<id>/receive` | Record income receipt | - | `{success, amount}` |
| POST | `/manual` | Add one-time income | `{source, amount, account_id, date}` | `{success}` |
| DELETE | `/<id>` | Delete income source | - | `{success}` |

### Recurring Payments (`/api/recurring`)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/` | Get all recurring payments | - | `[{id, name, amount, frequency, next_date}]` |
| POST | `/` | Add recurring payment | `{name, amount, frequency, account_id, next_date}` | `{id}` |
| POST | `/<id>/process` | Process due payment | - | `{success}` |
| DELETE | `/<id>` | Delete recurring | - | `{success}` |

### Savings Goals (`/api/savings`)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/` | Get all savings goals | - | `[{id, name, target, saved, deadline}]` |
| POST | `/` | Add savings goal | `{name, target, saved, deadline}` | `{id}` |
| PUT | `/<id>` | Add money to goal | `{amount}` | `{success}` |
| DELETE | `/<id>` | Delete savings goal | - | `{success}` |

### EMIs / Loans (`/api/emis`)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/` | Get all EMIs | - | `[{id, name, principal, emi_amount, remaining_months}]` |
| POST | `/` | Add new EMI | `{name, principal, emi_amount, remaining_months, account_id, due_date}` | `{id}` |
| POST | `/<id>/pay` | Pay monthly EMI | - | `{success, remaining}` |
| DELETE | `/<id>` | Delete EMI | - | `{success}` |

### Analytics (`/api/analytics`)

| Method | Endpoint | Description | Query Params | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/monthly` | Monthly income/expenses | `year` | `[{month, total, type}]` |
| GET | `/category` | Category-wise spending | `month` | `[{name, total}]` |
| GET | `/daily` | Daily spending | `month` | `[{date, total}]` |
| GET | `/summary` | Dashboard summary | - | `{total_balance, monthly_income, monthly_expenses, savings_rate, due_recurring}` |

### Data Management (`/api/data`)

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/export` | Export all user data | JSON file download |
| POST | `/reset` | Reset all user data | `{success}` |

---

## Frontend Components

### Core Components (`App.jsx`)
| Component | Functionality |
|-----------|---------------|
| `App` | Main application wrapper, manages authentication state, global state, and section routing |

### Authentication (`AuthScreen.jsx`)
| Component | Functionality |
|-----------|---------------|
| `AuthScreen` | Handles user login and registration with form validation |

### Layout Components
| Component | Functionality |
|-----------|---------------|
| `Header` | Displays user info, currency, dark mode toggle, logout button |
| `Sidebar` | Navigation menu with active section highlighting and due payments badge |

### Feature Components

#### `Dashboard.jsx`
| Feature | Description |
|---------|-------------|
| Summary Cards | Shows total balance, monthly income, expenses, savings rate |
| Quick Actions | Buttons to add expense, income, transfer, view analytics |
| Recent Expenses | Last 5 transactions in descending order (newest first) |
| Monthly Chart | Bar chart comparing income vs expenses across months |

#### `Expenses.jsx`
| Feature | Description |
|---------|-------------|
| Add Expense | Form with item name, amount, category selection, account selection |
| Expense List | Searchable table with delete functionality |
| Date Selection | Can back-date expenses for accurate tracking |

#### `Categories.jsx`
| Feature | Description |
|---------|-------------|
| Add Category | Create spending categories with budget limits |
| Category List | View and delete existing categories |

#### `Accounts.jsx`
| Feature | Description |
|---------|-------------|
| Add Account | Create cash, bank, or credit card accounts |
| Transfer Money | Move funds between accounts with balance validation |
| Account List | View balances and delete accounts |

#### `Income.jsx`
| Feature | Description |
|---------|-------------|
| Income Sources | Add recurring income (salary, freelance, etc.) |
| Manual Income | Add one-time income with date selection |
| Receive Income | Record income receipt and update balance |

#### `Recurring.jsx`
| Feature | Description |
|---------|-------------|
| Add Recurring | Setup weekly/monthly/yearly payments (Netflix, rent, etc.) |
| Process Payments | Pay due subscriptions with balance checking |
| Due Badge | Shows number of pending payments |

#### `Emis.jsx`
| Feature | Description |
|---------|-------------|
| Add EMI | Track loans with principal, EMI amount, remaining months |
| Pay EMI | Monthly payment with automatic principal reduction |
| Progress Bar | Visual representation of loan repayment |

#### `Savings.jsx`
| Feature | Description |
|---------|-------------|
| Add Goal | Create savings targets with deadline |
| Add Money | Transfer from accounts to savings goals |
| Progress Tracking | Percentage completion with visual bar |

#### `Analytics.jsx`
| Feature | Description |
|---------|-------------|
| Monthly Chart | Bar chart showing income vs expenses by month |
| Category Chart | Doughnut chart for spending by category |
| Daily Chart | Line chart for daily spending in selected month |
| Statistics | Total expenses, income, average monthly spend, top category |

#### `Settings.jsx`
| Feature | Description |
|---------|-------------|
| Profile Update | Change name, salary, currency preference |
| Data Export | Download all user data as JSON |
| Data Reset | Clear all data and reset to defaults |

#### Utility Components
| Component | Functionality |
|-----------|---------------|
| `Toast` | Temporary notification messages for user actions |
| `API` | Centralized fetch wrapper with error handling |

---

## Database Schema

### Tables and Relationships

```sql
users (id, name, email, password_hash, currency, salary)
  ├── accounts (user_id → users.id)
  ├── categories (user_id → users.id)
  ├── expenses (user_id → users.id, category_id → categories.id, account_id → accounts.id)
  ├── income_sources (user_id → users.id, account_id → accounts.id)
  ├── recurring (user_id → users.id, account_id → accounts.id)
  ├── savings_goals (user_id → users.id)
  └── emis (user_id → users.id, account_id → accounts.id)


Default Data on Registration
Category	Budget (₹)
Food & Dining	5,000
Transportation	3,000
Shopping	4,000
Entertainment	2,000
Bills & Utilities	8,000
Healthcare	2,000
Education	3,000
Other	2,000
Account	Type
Cash	cash
Bank Account	bank


Installation & Setup
Prerequisites
Python 3.11+
Node.js 18+
Git



# Clone repository
git clone https://github.com/Shubankar-Sridhar/FinTrack.git

Backend Setup
cd FinTrack/backend

# Create virtual environment
python -m venv venv

# Activate venv (Windows)
venv\Scripts\activate
# OR (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database initialization (automatic on first start)
python app.py


Frontend Setup
# Install dependencies
npm install
# Start development server
npm run dev


Execution

Start server by:
cd backend
python app.py

Start frontend by:
npm run dev

visit : https://localhost:5173



