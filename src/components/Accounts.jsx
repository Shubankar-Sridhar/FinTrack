import React, { useState } from 'react';
import API from '../utils/api';

function Accounts({ state, currency, fmt, loadAll, showToast }) {
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState('cash');
    const [newBalance, setNewBalance] = useState(0);
    const [newLimit, setNewLimit] = useState(0);
    const [transferFrom, setTransferFrom] = useState('');
    const [transferTo, setTransferTo] = useState('');
    const [transferAmount, setTransferAmount] = useState('');

    const addAccount = async () => {
        if (!newName) {
            showToast('Please enter account name', 'error');
            return;
        }
        await API('POST', '/accounts', {
            name: newName,
            type: newType,
            balance: parseFloat(newBalance) || 0,
            credit_limit: parseFloat(newLimit) || 0
        });
        showToast('Account added!', 'success');
        setNewName('');
        setNewBalance(0);
        setNewLimit(0);
        await loadAll();
    };

    const deleteAccount = async (id) => {
        if (!window.confirm('Delete this account?')) return;
        await API('DELETE', `/accounts/${id}`);
        showToast('Account deleted', 'success');
        await loadAll();
    };

    const transferMoney = async () => {
        if (!transferFrom || !transferTo || !transferAmount || parseFloat(transferAmount) <= 0) {
            showToast('Please fill all fields', 'error');
            return;
        }
        if (transferFrom === transferTo) {
            showToast('Cannot transfer to same account', 'error');
            return;
        }
        const r = await API('POST', '/accounts/transfer', {
            from_id: parseInt(transferFrom),
            to_id: parseInt(transferTo),
            amount: parseFloat(transferAmount)
        });
        if (r.error) {
            showToast(r.error, 'error');
        } else {
            showToast('Transfer completed!', 'success');
            setTransferAmount('');
            await loadAll();
        }
    };

    return (
        <section id="accounts" className="section active">
            <h2 className="section-title">Accounts</h2>

            <div className="card" style={{ marginBottom: '20px' }}>
                <h3>Add New Account</h3>
                <div className="form-row">
                    <div className="form-group">
                        <label>Account Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g., Cash"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Account Type</label>
                        <select 
                            value={newType}
                            onChange={(e) => setNewType(e.target.value)}
                        >
                            <option value="cash">Cash</option>
                            <option value="bank">Bank Account</option>
                            <option value="credit">Credit Card</option>
                            <option value="wallet">UPI/Wallet</option>
                        </select>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Initial Balance</label>
                        <input 
                            type="number" 
                            value={newBalance}
                            onChange={(e) => setNewBalance(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Credit Limit (if credit card)</label>
                        <input 
                            type="number" 
                            value={newLimit}
                            onChange={(e) => setNewLimit(e.target.value)}
                        />
                    </div>
                </div>
                <button className="btn" onClick={addAccount}>Add Account</button>
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
                <h3>Transfer Money</h3>
                <div className="form-row">
                    <div className="form-group">
                        <label>From Account</label>
                        <select 
                            value={transferFrom}
                            onChange={(e) => setTransferFrom(e.target.value)}
                        >
                            <option value="">Select account</option>
                            {state.accounts.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.name} ({fmt(a.balance)})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>To Account</label>
                        <select 
                            value={transferTo}
                            onChange={(e) => setTransferTo(e.target.value)}
                        >
                            <option value="">Select account</option>
                            {state.accounts.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.name} ({fmt(a.balance)})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Amount</label>
                        <input 
                            type="number" 
                            value={transferAmount}
                            onChange={(e) => setTransferAmount(e.target.value)}
                        />
                    </div>
                </div>
                <button className="btn" onClick={transferMoney}>Transfer</button>
            </div>

            <div id="accountsList">
                {state.accounts.length > 0 ? state.accounts.map(a => (
                    <div className="account-item" key={a.id}>
                        <div className="account-header">
                            <span className="account-name">
                                {a.name} <small style={{ fontWeight: 'normal', color: '#777' }}>({a.type})</small>
                            </span>
                            <span className={a.balance < 0 ? 'negative' : 'positive'} 
                                  style={{ fontSize: '22px', fontWeight: 'bold' }}>
                                {fmt(a.balance)}
                            </span>
                        </div>
                        {a.type === 'credit' && (
                            <div style={{ fontSize: '13px', color: '#777' }}>
                                Credit Limit: {fmt(a.credit_limit)} | Available: {fmt(a.credit_limit + a.balance)}
                            </div>
                        )}
                        <button 
                            className="btn btn-small btn-red" 
                            onClick={() => deleteAccount(a.id)}
                            style={{ marginTop: '8px' }}
                        >
                            Delete
                        </button>
                    </div>
                )) : (
                    <p style={{ color: '#777', padding: '20px' }}>No accounts yet.</p>
                )}
            </div>
        </section>
    );
}

export default Accounts;