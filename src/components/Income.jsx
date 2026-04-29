import React, { useState, useEffect } from 'react';
import API from '../utils/api';

function Income({ state, currency, fmt, loadAll, showToast }) {
    const [newName, setNewName] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newFrequency, setNewFrequency] = useState('monthly');
    const [newAccountId, setNewAccountId] = useState('');

    useEffect(() => {
        if (state.accounts.length > 0 && !newAccountId) {
            const defaultAcc = state.accounts.find(a => a.name === 'Bank Account');
            setNewAccountId(defaultAcc?.id || state.accounts[0]?.id);
        }
    }, [state.accounts]);

    const addIncomeSource = async () => {
        if (!newName || !newAmount || !newAccountId) {
            showToast('Please fill all fields', 'error');
            return;
        }
        await API('POST', '/income', {
            name: newName,
            amount: parseFloat(newAmount),
            frequency: newFrequency,
            account_id: parseInt(newAccountId)
        });
        showToast('Income source added!', 'success');
        setNewName('');
        setNewAmount('');
        await loadAll();
    };

    const receiveIncome = async (id) => {
        const r = await API('POST', `/income/${id}/receive`);
        if (r.error) {
            showToast(r.error, 'error');
        } else {
            showToast(`${fmt(r.amount)} income received!`, 'success');
            await loadAll();
        }
    };

    const deleteIncomeSource = async (id) => {
        if (!window.confirm('Delete this income source?')) return;
        await API('DELETE', `/income/${id}`);
        showToast('Deleted', 'success');
        await loadAll();
    };

    return (
        <section id="income" className="section active">
            <h2 className="section-title">Income</h2>

            <div className="card" style={{ marginBottom: '20px' }}>
                <h3>Add Income Source</h3>
                <div className="form-row">
                    <div className="form-group">
                        <label>Source Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g., Salary"
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
                                <option key={a.id} value={a.id}>
                                    {a.name} ({fmt(a.balance)})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <button className="btn" onClick={addIncomeSource}>Add Source</button>
            </div>

            <h3>Income Sources</h3>
            <table>
                <thead>
                    <tr>
                        <th>Source</th>
                        <th>Amount</th>
                        <th>Frequency</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {state.incomeSources.length > 0 ? state.incomeSources.map(s => (
                        <tr key={s.id}>
                            <td>{s.name}</td>
                            <td>{fmt(s.amount)}</td>
                            <td>{s.frequency}</td>
                            <td>
                                <button 
                                    className="btn btn-small btn-green" 
                                    onClick={() => receiveIncome(s.id)}
                                >
                                    Receive
                                </button>
                                <button 
                                    className="btn btn-small btn-red" 
                                    onClick={() => deleteIncomeSource(s.id)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="4" style={{ color: '#777', textAlign: 'center' }}>
                                No income sources
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </section>
    );
}

export default Income;