import React, { useState, useEffect } from 'react';
import API from '../utils/api';

function Emis({ state, currency, fmt, loadAll, showToast }) {
    const [newName, setNewName] = useState('');
    const [newPrincipal, setNewPrincipal] = useState('');
    const [newEmiAmount, setNewEmiAmount] = useState('');
    const [newMonths, setNewMonths] = useState('');
    const [newDueDate, setNewDueDate] = useState(1);
    const [newAccountId, setNewAccountId] = useState('');

    useEffect(() => {
        if (state.accounts.length > 0 && !newAccountId) {
            const defaultAcc = state.accounts.find(a => a.name === 'Bank Account');
            setNewAccountId(defaultAcc?.id || state.accounts[0]?.id);
        }
    }, [state.accounts]);

    const addEmi = async () => {
        if (!newName || !newPrincipal || !newEmiAmount || !newMonths || !newAccountId) {
            showToast('Please fill all fields', 'error');
            return;
        }
        await API('POST', '/emis', {
            name: newName,
            principal: parseFloat(newPrincipal),
            emi_amount: parseFloat(newEmiAmount),
            remaining_months: parseInt(newMonths),
            account_id: parseInt(newAccountId),
            due_date: newDueDate
        });
        showToast('EMI added!', 'success');
        setNewName('');
        setNewPrincipal('');
        setNewEmiAmount('');
        setNewMonths('');
        await loadAll();
    };

    const payEmi = async (id) => {
        const r = await API('POST', `/emis/${id}/pay`);
        if (r.error) {
            showToast(r.error, 'error');
        } else {
            showToast(
                r.remaining > 0 
                    ? `EMI paid! ${r.remaining} months remaining` 
                    : 'Loan fully paid off! 🎉',
                'success'
            );
            await loadAll();
        }
    };

    const deleteEmi = async (id) => {
        if (!window.confirm('Delete this EMI?')) return;
        await API('DELETE', `/emis/${id}`);
        showToast('Deleted', 'success');
        await loadAll();
    };

    return (
        <section id="emis" className="section active">
            <h2 className="section-title">EMI / Loans</h2>

            <div className="card" style={{ marginBottom: '20px' }}>
                <h3>Add EMI / Loan</h3>
                <div className="form-row">
                    <div className="form-group">
                        <label>Loan Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g., Home Loan"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Principal Amount</label>
                        <input 
                            type="number" 
                            placeholder="500000"
                            value={newPrincipal}
                            onChange={(e) => setNewPrincipal(e.target.value)}
                        />
                    </div>
                </div>
                <div className="form-row-3">
                    <div className="form-group">
                        <label>EMI Amount / Month</label>
                        <input 
                            type="number" 
                            placeholder="15000"
                            value={newEmiAmount}
                            onChange={(e) => setNewEmiAmount(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Remaining Months</label>
                        <input 
                            type="number" 
                            placeholder="24"
                            value={newMonths}
                            onChange={(e) => setNewMonths(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Due Day of Month</label>
                        <input 
                            type="number" 
                            value={newDueDate} 
                            min="1" 
                            max="28"
                            onChange={(e) => setNewDueDate(parseInt(e.target.value) || 1)}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label>Deduct from Account</label>
                    <select 
                        value={newAccountId}
                        onChange={(e) => setNewAccountId(e.target.value)}
                    >
                        {state.accounts.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </select>
                </div>
                <button className="btn" onClick={addEmi}>Add EMI</button>
            </div>

            <div id="emiList">
                {state.emis?.length > 0 ? state.emis.map(e => {
                    const totalRemaining = e.emi_amount * e.remaining_months;
                    const pct = Math.round(((e.principal - totalRemaining) / e.principal) * 100);

                    return (
                        <div className="emi-item" key={e.id}>
                            <div className="account-header">
                                <span className="account-name">{e.name}</span>
                                <span className="negative">{fmt(e.emi_amount)}/mo</span>
                            </div>
                            <div>
                                Principal: {fmt(e.principal)} | Remaining: {e.remaining_months} months ({fmt(totalRemaining)})
                            </div>
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ width: `${pct}%`, background: '#27ae60' }}
                                ></div>
                            </div>
                            <div style={{ fontSize: '12px', color: '#777', marginTop: '4px' }}>
                                {pct}% paid off
                            </div>
                            <div style={{ marginTop: '10px' }}>
                                <button 
                                    className="btn btn-small btn-orange" 
                                    onClick={() => payEmi(e.id)}
                                >
                                    Pay This Month
                                </button>
                                <button 
                                    className="btn btn-small btn-red" 
                                    onClick={() => deleteEmi(e.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    );
                }) : (
                    <p style={{ color: '#777', padding: '20px' }}>No EMIs / Loans added yet.</p>
                )}
            </div>
        </section>
    );
}

export default Emis;