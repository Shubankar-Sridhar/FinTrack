from flask import Flask, request, jsonify, send_from_directory, session
import sqlite3, hashlib, os, json
from datetime import datetime, date
from functools import wraps

# CHANGE 1: Import from database.py instead
from database import get_db, init_db, close_db, seed_defaults

app = Flask(__name__, static_folder='.')
app.secret_key = 'secret_key'

# CHANGE 2: Register cleanup function
app.teardown_appcontext(close_db)

DB_PATH = 'money_tracker.db'  # Keep this for reference but not used directly

def hash_password(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

def current_user_id():
    return session.get('user_id')

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user_id():
            return jsonify({'error': 'Not authenticated'}), 401
        return f(*args, **kwargs)
    return decorated

# CHANGE 3: Remove your old get_db() and init_db() from here
# They are now in database.py

# CHANGE 4: Remove your old seed_defaults() from here
# It's now in database.py

# ============================================
# YOUR EXACT ROUTES - NO CHANGES NEEDED
# ============================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    d = request.json
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute('INSERT INTO users (name, email, password_hash, currency, salary) VALUES (?,?,?,?,?)',
                  (d['name'], d['email'], hash_password(d['password']), d.get('currency','₹'), d.get('salary',0)))
        user_id = c.lastrowid
        conn.commit()
        seed_defaults(user_id, d.get('salary', 0)) 
        session['user_id'] = user_id
        session['user_name'] = d['name']
        return jsonify({'success': True, 'name': d['name'], 'id': user_id})
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Email already registered'}), 400

@app.route('/api/auth/login', methods=['POST'])
def login():
    d = request.json
    conn = get_db()
    c = conn.cursor()
    row = c.execute('SELECT * FROM users WHERE email=? AND password_hash=?',
                    (d['email'], hash_password(d['password']))).fetchone()
    if row:
        session['user_id'] = row['id']
        session['user_name'] = row['name']
        return jsonify({'success': True, 'name': row['name'], 'id': row['id'], 'currency': row['currency']})
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})

@app.route('/api/auth/me', methods=['GET'])
def me():
    uid = current_user_id()
    if not uid:
        return jsonify({'authenticated': False})
    conn = get_db()
    row = conn.execute('SELECT id, name, email, currency, salary FROM users WHERE id=?', (uid,)).fetchone()
    if row:
        return jsonify({'authenticated': True, 'user': dict(row)})
    return jsonify({'authenticated': False})

@app.route('/api/settings', methods=['PUT'])
@require_auth
def update_settings():
    d = request.json
    uid = current_user_id()
    salary = d.get('salary', 0)
    conn = get_db()
    conn.execute('UPDATE users SET name=?, salary=?, currency=? WHERE id=?',
                 (d['name'], salary, d.get('currency','₹'), uid))
    conn.execute('UPDATE income_sources SET amount=? WHERE user_id=? AND name=?',
                 (salary, uid, 'Salary')) 
    conn.commit()
    session['user_name'] = d['name']
    return jsonify({'success': True})

@app.route('/api/categories', methods=['GET'])
@require_auth
def get_categories():
    uid = current_user_id()
    conn = get_db()
    rows = conn.execute('SELECT * FROM categories WHERE user_id=?', (uid,)).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/categories', methods=['POST'])
@require_auth
def add_category():
    d = request.json
    uid = current_user_id()
    conn = get_db()
    c = conn.execute('INSERT INTO categories (user_id, name, budget) VALUES (?,?,?)',
                     (uid, d['name'], d.get('budget',0)))
    new_id = c.lastrowid
    conn.commit()
    return jsonify({'id': new_id, 'name': d['name'], 'budget': d.get('budget',0)})

@app.route('/api/categories/<int:cid>', methods=['DELETE'])
@require_auth
def delete_category(cid):
    uid = current_user_id()
    conn = get_db()
    conn.execute('DELETE FROM categories WHERE id=? AND user_id=?', (cid, uid))
    conn.commit()
    return jsonify({'success': True})

@app.route('/api/accounts', methods=['GET'])
@require_auth
def get_accounts():
    uid = current_user_id()
    conn = get_db()
    rows = conn.execute('SELECT * FROM accounts WHERE user_id=?', (uid,)).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/accounts', methods=['POST'])
@require_auth
def add_account():
    d = request.json
    uid = current_user_id()
    conn = get_db()
    bal = d.get('balance',0)
    c = conn.execute('INSERT INTO accounts (user_id, name, type, balance, credit_limit) VALUES (?,?,?,?,?)',
                     (uid, d['name'], d['type'], bal, d.get('credit_limit',0)))
    new_id = c.lastrowid
    conn.commit()
    return jsonify({'id': new_id})

@app.route('/api/accounts/<int:aid>', methods=['DELETE'])
@require_auth
def delete_account(aid):
    uid = current_user_id()
    conn = get_db()
    conn.execute('DELETE FROM accounts WHERE id=? AND user_id=?', (aid, uid))
    conn.commit()
    return jsonify({'success': True})

@app.route('/api/accounts/transfer', methods=['POST'])
@require_auth
def transfer():
    d = request.json
    uid = current_user_id()
    conn = get_db()
    frm = conn.execute('SELECT * FROM accounts WHERE id=? AND user_id=?', (d['from_id'], uid)).fetchone()
    to = conn.execute('SELECT * FROM accounts WHERE id=? AND user_id=?', (d['to_id'], uid)).fetchone()
    if not frm or not to:
        return jsonify({'error': 'Account not found'}), 404
    amt = float(d['amount'])
    if frm['balance'] < amt:
        return jsonify({'error': 'Insufficient balance'}), 400
    conn.execute('UPDATE accounts SET balance=balance-? WHERE id=?', (amt, frm['id']))
    conn.execute('UPDATE accounts SET balance=balance+? WHERE id=?', (amt, to['id']))
    today = date.today().isoformat()
    conn.execute('INSERT INTO expenses (user_id,item,amount,account_id,date,type) VALUES (?,?,?,?,?,?)',
                 (uid, f"Transfer to {to['name']}", amt, frm['id'], today, 'transfer'))
    conn.commit()
    return jsonify({'success': True})

@app.route('/api/expenses', methods=['GET'])
@require_auth
def get_expenses():
    uid = current_user_id()
    conn = get_db()
    rows = conn.execute(
        'SELECT e.*, c.name as category_name, a.name as account_name FROM expenses e '
        'LEFT JOIN categories c ON e.category_id=c.id '
        'LEFT JOIN accounts a ON e.account_id=a.id '
        'WHERE e.user_id=? ORDER BY e.date DESC', (uid,)
    ).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/expenses', methods=['POST'])
@require_auth
def add_expense():
    d = request.json
    uid = current_user_id()
    conn = get_db()
    amt = float(d['amount'])
    acc = conn.execute('SELECT * FROM accounts WHERE id=? AND user_id=?', (d['account_id'], uid)).fetchone()
    if acc and acc['type'] != 'credit' and acc['balance'] < amt:
        return jsonify({'error': 'Insufficient balance'}), 400
    if acc:
        conn.execute('UPDATE accounts SET balance=balance-? WHERE id=?', (amt, acc['id']))
    c = conn.execute(
        'INSERT INTO expenses (user_id,item,amount,quantity,unit_price,category_id,account_id,date,notes,type) VALUES (?,?,?,?,?,?,?,?,?,?)',
        (uid, d['item'], amt, d.get('quantity',1), d.get('unit_price',0),
         d.get('category_id'), d['account_id'], d['date'], d.get('notes',''), 'expense')
    )
    new_id = c.lastrowid
    conn.commit()
    return jsonify({'id': new_id})

@app.route('/api/expenses/<int:eid>', methods=['DELETE'])
@require_auth
def delete_expense(eid):
    uid = current_user_id()
    conn = get_db()
    row = conn.execute('SELECT * FROM expenses WHERE id=? AND user_id=?', (eid, uid)).fetchone()
    if row and row['type'] == 'expense' and row['account_id']:
        conn.execute('UPDATE accounts SET balance=balance+? WHERE id=?', (row['amount'], row['account_id']))
    conn.execute('DELETE FROM expenses WHERE id=? AND user_id=?', (eid, uid))
    conn.commit()
    return jsonify({'success': True})

@app.route('/api/income', methods=['GET'])
@require_auth
def get_income():
    uid = current_user_id()
    conn = get_db()
    rows = conn.execute('SELECT * FROM income_sources WHERE user_id=?', (uid,)).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/income', methods=['POST'])
@require_auth
def add_income():
    d = request.json
    uid = current_user_id()
    conn = get_db()
    c = conn.execute('INSERT INTO income_sources (user_id,name,amount,frequency,account_id) VALUES (?,?,?,?,?)',
                     (uid, d['name'], d['amount'], d['frequency'], d['account_id']))
    new_id = c.lastrowid
    conn.commit()
    return jsonify({'id': new_id})

@app.route('/api/income/<int:iid>/receive', methods=['POST'])
@require_auth
def receive_income(iid):
    uid = current_user_id()
    conn = get_db()
    src = conn.execute('SELECT * FROM income_sources WHERE id=? AND user_id=?', (iid, uid)).fetchone()
    if not src:
        return jsonify({'error': 'Not found'}), 404
    conn.execute('UPDATE accounts SET balance=balance+? WHERE id=?', (src['amount'], src['account_id']))
    today = date.today().isoformat()
    conn.execute('INSERT INTO expenses (user_id,item,amount,account_id,date,type) VALUES (?,?,?,?,?,?)',
                 (uid, src['name'], src['amount'], src['account_id'], today, 'income'))
    conn.commit()
    return jsonify({'success': True, 'amount': src['amount']})

@app.route('/api/income/<int:iid>', methods=['DELETE'])
@require_auth
def delete_income(iid):
    uid = current_user_id()
    conn = get_db()
    conn.execute('DELETE FROM income_sources WHERE id=? AND user_id=?', (iid, uid))
    conn.commit()
    return jsonify({'success': True})

@app.route('/api/income/manual', methods=['POST'])
@require_auth
def add_manual_income():
    d = request.json
    uid = current_user_id()
    conn = get_db()
    amt = float(d['amount'])
    conn.execute('UPDATE accounts SET balance=balance+? WHERE id=? AND user_id=?', (amt, d['account_id'], uid))
    c = conn.execute('INSERT INTO expenses (user_id,item,amount,account_id,date,type) VALUES (?,?,?,?,?,?)',
                     (uid, d['source'], amt, d['account_id'], d['date'], 'income'))
    conn.commit()
    return jsonify({'success': True})

@app.route('/api/recurring', methods=['GET'])
@require_auth
def get_recurring():
    uid = current_user_id()
    conn = get_db()
    rows = conn.execute('SELECT * FROM recurring WHERE user_id=?', (uid,)).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/recurring', methods=['POST'])
@require_auth
def add_recurring():
    d = request.json
    uid = current_user_id()
    conn = get_db()
    c = conn.execute('INSERT INTO recurring (user_id,name,amount,frequency,account_id,next_date) VALUES (?,?,?,?,?,?)',
                     (uid, d['name'], d['amount'], d['frequency'], d['account_id'], d['next_date']))
    new_id = c.lastrowid
    conn.commit()
    return jsonify({'id': new_id})

@app.route('/api/recurring/<int:rid>/process', methods=['POST'])
@require_auth
def process_recurring(rid):
    uid = current_user_id()
    conn = get_db()
    rec = conn.execute('SELECT * FROM recurring WHERE id=? AND user_id=?', (rid, uid)).fetchone()
    if not rec:
        return jsonify({'error': 'Not found'}), 404
    acc = conn.execute('SELECT * FROM accounts WHERE id=?', (rec['account_id'],)).fetchone()
    if not acc or acc['balance'] < rec['amount']:
        return jsonify({'error': 'Insufficient balance'}), 400
    conn.execute('UPDATE accounts SET balance=balance-? WHERE id=?', (rec['amount'], rec['account_id']))
    today = date.today().isoformat()
    conn.execute('INSERT INTO expenses (user_id,item,amount,account_id,date,type) VALUES (?,?,?,?,?,?)',
                 (uid, rec['name'], rec['amount'], rec['account_id'], today, 'expense'))
    from datetime import date as dt, timedelta
    nd = datetime.strptime(rec['next_date'], '%Y-%m-%d').date()
    if rec['frequency'] == 'weekly': nd = nd + timedelta(weeks=1)
    elif rec['frequency'] == 'monthly':
        try:
            from dateutil.relativedelta import relativedelta
            nd = nd + relativedelta(months=1)
        except:
            month = nd.month % 12 + 1
            year = nd.year + (1 if nd.month == 12 else 0)
            nd = nd.replace(year=year, month=month)
    elif rec['frequency'] == 'yearly': nd = nd.replace(year=nd.year+1)
    conn.execute('UPDATE recurring SET next_date=? WHERE id=?', (nd.isoformat(), rid))
    conn.commit()
    return jsonify({'success': True})

@app.route('/api/recurring/<int:rid>', methods=['DELETE'])
@require_auth
def delete_recurring(rid):
    uid = current_user_id()
    conn = get_db()
    conn.execute('DELETE FROM recurring WHERE id=? AND user_id=?', (rid, uid))
    conn.commit()
    return jsonify({'success': True})

@app.route('/api/savings', methods=['GET'])
@require_auth
def get_savings():
    uid = current_user_id()
    conn = get_db()
    rows = conn.execute('SELECT * FROM savings_goals WHERE user_id=?', (uid,)).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/savings', methods=['POST'])
@require_auth
def add_savings():
    d = request.json
    uid = current_user_id()
    conn = get_db()
    c = conn.execute('INSERT INTO savings_goals (user_id,name,target,saved,deadline) VALUES (?,?,?,?,?)',
                     (uid, d['name'], d['target'], d.get('saved',0), d.get('deadline','')))
    new_id = c.lastrowid
    conn.commit()
    return jsonify({'id': new_id})

@app.route('/api/savings/<int:sid>', methods=['PUT'])
@require_auth
def update_savings(sid):
    d = request.json
    uid = current_user_id()
    conn = get_db()
    conn.execute('UPDATE savings_goals SET saved=saved+? WHERE id=? AND user_id=?', (d['amount'], sid, uid))
    conn.commit()
    return jsonify({'success': True})

@app.route('/api/savings/<int:sid>', methods=['DELETE'])
@require_auth
def delete_savings(sid):
    uid = current_user_id()
    conn = get_db()
    conn.execute('DELETE FROM savings_goals WHERE id=? AND user_id=?', (sid, uid))
    conn.commit()
    return jsonify({'success': True})

@app.route('/api/emis', methods=['GET'])
@require_auth
def get_emis():
    uid = current_user_id()
    conn = get_db()
    rows = conn.execute('SELECT * FROM emis WHERE user_id=?', (uid,)).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/emis', methods=['POST'])
@require_auth
def add_emi():
    d = request.json
    uid = current_user_id()
    conn = get_db()
    c = conn.execute('INSERT INTO emis (user_id,name,principal,emi_amount,remaining_months,account_id,due_date) VALUES (?,?,?,?,?,?,?)',
                     (uid, d['name'], d['principal'], d['emi_amount'], d['remaining_months'], d['account_id'], d.get('due_date',1)))
    new_id = c.lastrowid
    conn.commit()
    return jsonify({'id': new_id})

@app.route('/api/emis/<int:eid>/pay', methods=['POST'])
@require_auth
def pay_emi(eid):
    uid = current_user_id()
    conn = get_db()
    emi = conn.execute('SELECT * FROM emis WHERE id=? AND user_id=?', (eid, uid)).fetchone()
    if not emi:
        return jsonify({'error': 'Not found'}), 404
    acc = conn.execute('SELECT * FROM accounts WHERE id=?', (emi['account_id'],)).fetchone()
    if not acc or acc['balance'] < emi['emi_amount']:
        return jsonify({'error': 'Insufficient balance'}), 400
    conn.execute('UPDATE accounts SET balance=balance-? WHERE id=?', (emi['emi_amount'], emi['account_id']))
    today = date.today().isoformat()
    conn.execute('INSERT INTO expenses (user_id,item,amount,account_id,date,type) VALUES (?,?,?,?,?,?)',
                 (uid, f"EMI: {emi['name']}", emi['emi_amount'], emi['account_id'], today, 'expense'))
    new_rem = emi['remaining_months'] - 1
    if new_rem <= 0:
        conn.execute('DELETE FROM emis WHERE id=?', (eid,))
    else:
        conn.execute('UPDATE emis SET remaining_months=? WHERE id=?', (new_rem, eid))
    conn.commit()
    return jsonify({'success': True, 'remaining': new_rem})

@app.route('/api/emis/<int:eid>', methods=['DELETE'])
@require_auth
def delete_emi(eid):
    uid = current_user_id()
    conn = get_db()
    conn.execute('DELETE FROM emis WHERE id=? AND user_id=?', (eid, uid))
    conn.commit()
    return jsonify({'success': True})

@app.route('/api/analytics/monthly', methods=['GET'])
@require_auth
def analytics_monthly():
    uid = current_user_id()
    year = request.args.get('year', date.today().year)
    conn = get_db()
    rows = conn.execute(
        "SELECT strftime('%m', date) as month, SUM(amount) as total, type "
        "FROM expenses WHERE user_id=? AND strftime('%Y',date)=? "
        "GROUP BY month, type ORDER BY month",
        (uid, str(year))
    ).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/analytics/category', methods=['GET'])
@require_auth
def analytics_category():
    uid = current_user_id()
    month = request.args.get('month', date.today().strftime('%Y-%m'))
    conn = get_db()
    rows = conn.execute(
        "SELECT c.name, SUM(e.amount) as total FROM expenses e "
        "LEFT JOIN categories c ON e.category_id=c.id "
        "WHERE e.user_id=? AND e.type='expense' AND strftime('%Y-%m', e.date)=? "
        "GROUP BY e.category_id ORDER BY total DESC",
        (uid, month)
    ).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/analytics/daily', methods=['GET'])
@require_auth
def analytics_daily():
    uid = current_user_id()
    month = request.args.get('month', date.today().strftime('%Y-%m'))
    conn = get_db()
    rows = conn.execute(
        "SELECT date, SUM(amount) as total FROM expenses "
        "WHERE user_id=? AND type='expense' AND strftime('%Y-%m',date)=? "
        "GROUP BY date ORDER BY date",
        (uid, month)
    ).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/analytics/summary', methods=['GET'])
@require_auth
def analytics_summary():
    uid = current_user_id()
    conn = get_db()
    today = date.today()
    this_month = today.strftime('%Y-%m')

    total_balance = conn.execute(
        "SELECT COALESCE(SUM(balance),0) as total FROM accounts WHERE user_id=? AND type!='credit'", (uid,)
    ).fetchone()['total']

    monthly_exp = conn.execute(
        "SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE user_id=? AND type='expense' AND strftime('%Y-%m',date)=?",
        (uid, this_month)
    ).fetchone()['total']

    monthly_inc_txn = conn.execute(
        "SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE user_id=? AND type='income' AND strftime('%Y-%m',date)=?",
        (uid, this_month)
    ).fetchone()['total']

    income_sources_monthly = conn.execute(
        "SELECT COALESCE(SUM(amount),0) as total FROM income_sources WHERE user_id=? AND frequency='monthly'", (uid,)
    ).fetchone()['total']

    monthly_inc = monthly_inc_txn

    due_recurring = conn.execute(
        "SELECT COUNT(*) as cnt FROM recurring WHERE user_id=? AND next_date<=?",
        (uid, today.isoformat())
    ).fetchone()['cnt']

    savings_rate = round(((monthly_inc - monthly_exp) / monthly_inc) * 100) if monthly_inc > 0 else 0
    return jsonify({
        'total_balance': total_balance,
        'monthly_income': monthly_inc,
        'monthly_expenses': monthly_exp,
        'savings_rate': savings_rate,
        'due_recurring': due_recurring
    })

@app.route('/api/data/export', methods=['GET'])
@require_auth
def export_data():
    uid = current_user_id()
    conn = get_db()
    data = {
        'expenses': [dict(r) for r in conn.execute('SELECT * FROM expenses WHERE user_id=?', (uid,)).fetchall()],
        'categories': [dict(r) for r in conn.execute('SELECT * FROM categories WHERE user_id=?', (uid,)).fetchall()],
        'accounts': [dict(r) for r in conn.execute('SELECT * FROM accounts WHERE user_id=?', (uid,)).fetchall()],
        'income_sources': [dict(r) for r in conn.execute('SELECT * FROM income_sources WHERE user_id=?', (uid,)).fetchall()],
        'recurring': [dict(r) for r in conn.execute('SELECT * FROM recurring WHERE user_id=?', (uid,)).fetchall()],
        'savings_goals': [dict(r) for r in conn.execute('SELECT * FROM savings_goals WHERE user_id=?', (uid,)).fetchall()],
        'emis': [dict(r) for r in conn.execute('SELECT * FROM emis WHERE user_id=?', (uid,)).fetchall()],
    }
    from flask import Response
    return Response(json.dumps(data, indent=2), mimetype='application/json',
                    headers={'Content-Disposition': 'attachment;filename=money-tracker-backup.json'})

@app.route('/api/data/reset', methods=['POST'])
@require_auth
def reset_data():
    uid = current_user_id()
    conn = get_db()
    for table in ['expenses','categories','accounts','income_sources','recurring','savings_goals','emis']:
        conn.execute(f'DELETE FROM {table} WHERE user_id=?', (uid,))
    conn.commit()
    seed_defaults(uid)
    return jsonify({'success': True})


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path.startswith('api/'):
        return jsonify({'error': 'Not found'}), 404
    static_dir = os.path.join(os.path.dirname(__file__), 'static')
    if path and os.path.exists(os.path.join(static_dir, path)):
        return send_from_directory(static_dir, path)
    return send_from_directory(static_dir, 'index.html')


if __name__ == '__main__':
    init_db()
    print("Money Tracker running at http://localhost:5000")
    print("   Database:", os.path.abspath(DB_PATH))
    app.run(debug=True, port=5000)