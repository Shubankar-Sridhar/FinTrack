import React, { useState, useEffect } from 'react';
import API from '../utils/api';

function Recurring({ state, currency, fmt, today, loadAll, showToast }) {
    const [newName, setNewName] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newFrequency, setNewFrequency] = useState('monthly');
    const [newAccountId, setNewAccountId] = useState('');
    const [newNextDate, setNewNextDate] = useState(today());

    useEffect(() => {
        if (state.accounts.length > 0 && !newAccountId) {
            const defaultAcc = state.accounts.find(a => a.name === 'Bank Account');
            setNewAccountId(defaultAcc?.id || state.accounts[0]?.id);
        }
    }, [state.accounts]);

    const addRecurring = async () => {
        if (!newName || !newAmount || !newAccountId || !newNextDate) {
            showToast('Please fill all fields', 'error');
            return;
        }
        await API('POST', '/recurring', {
            name: newName,
            amount: parseFloat(newAmount),
            frequency: newFrequency,
            account_id: parseInt(newAccountId),
            next_date: newNextDate
        });
        showToast('Recurring payment added!', 'success');
        setNewName('');
        setNewAmount('');
        await loadAll();
    };

    const processRecurring = async (id) => {
        const r = await API('POST', `/recurring/${id}/process`);
        if (r.error) {
            showToast(r.error, 'error');
        } else {
            showToast('Payment processed!', 'success');
            await loadAll();
        }
    };

    const deleteRecurring = async (id) => {
        if (!window.confirm('Delete this recurring payment?')) return;
        await API('DELETE', `/recurring/${id}`);
        showToast('Deleted', 'success');
        await loadAll();
    };

    const processDuePayments = async () => {
        const dueRecs = state.recurring.filter(r => r.next_date <= today());
        if (!dueRecs.length) {
            showToast('No due payments', 'info');
            return;
        }
        let done = 0;
        for (const r of dueRecs) {
            const res = await API('POST', `/recurring/${r.id}/process`);
            if (res.success) done++;
        }
        showToast(`Processed ${done} payment(s)`, 'success');
        await loadAll();
    };

    const dueCount = state.recurring?.filter(r => r.next_date <= today()).length || 0;

    return (
        <section id="recurring" className="section active">
            <h2 className="section-title">Recurring Payments</h2>

            <div className="card" style={{ marginBottom: '20px' }}>
                <h3>Add Recurring Payment</h3>
                <div className="form-row">
                    <div className="form-group">
                        <label>Payment Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g., Netflix"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Amount</label>
                        <input 
                            type="number" 
                            value={newAmount}
                            onChange={(e) => setNewAmount(e.target.value)}
                        />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Frequency</label>
                        <select 
                            value={newFrequency}
                            onChange={(e) => setNewFrequency(e.target.value)}
                        >
                            <option value="monthly">Monthly</option>
                            <option value="weekly">Weekly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Account</label>
                        <select 
                            value={newAccountId}
                            onChange={(e) => setNewAccountId(e.target.value)}
                        >
                            {state.accounts.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="form-group">
                    <label>Next Due Date</label>
                    <input 
                        type="date" 
                        value={newNextDate}
                        onChange={(e) => setNewNextDate(e.target.value)}
                    />
                </div>
                <button className="btn" onClick={addRecurring}>Add Payment</button>
                <button className="btn btn-red" onClick={processDuePayments} style={{ marginLeft: '10px' }}>
                    Process All Due
                </button>
            </div>

            {dueCount > 0 && (
                <div className="alert alert-warning" style={{ display: 'block' }}>
                    You have {dueCount} payment(s) due!
                </div>
            )}

            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Amount</th>
                        <th>Frequency</th>
                        <th>Next Due</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {state.recurring?.length > 0 ? state.recurring.map(r => {
                        const due = r.next_date <= today();
                        return (
                            <tr key={r.id}>
                                <td>{r.name}</td>
                                <td>{fmt(r.amount)}</td>
                                <td>{r.frequency}</td>
                                <td>{r.next_date}</td>
                                <td>
                                    <span className={due ? 'negative' : 'positive'}>
                                        {due ? '⚠️ Due' : '⏳ Upcoming'}
                                    </span>
                                </td>
                                <td>
                                    {due && (
                                        <button 
                                            className="btn btn-small btn-green" 
                                            onClick={() => processRecurring(r.id)}
                                        >
                                            Pay Now
                                        </button>
                                    )}
                                    <button 
                                        className="btn btn-small btn-red" 
                                        onClick={() => deleteRecurring(r.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        );
                    }) : (
                        <tr>
                            <td colSpan="6" style={{ color: '#777', textAlign: 'center' }}>
                                No recurring payments
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </section>
    );
}

export default Recurring;