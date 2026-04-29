import React, { useState } from 'react';
import API from '../utils/api';

function Savings({ state, currency, fmt, loadAll, showToast }) {
    const [newName, setNewName] = useState('');
    const [newTarget, setNewTarget] = useState('');
    const [newSaved, setNewSaved] = useState(0);
    const [newDeadline, setNewDeadline] = useState('');
    
    // ONLY ADDITION: 3 lines for contribution state
    const [contributingId, setContributingId] = useState(null);
    const [contribAmount, setContribAmount] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');

    const addSavingsGoal = async () => {
        if (!newName || !newTarget) {
            showToast('Please fill required fields', 'error');
            return;
        }
        await API('POST', '/savings', {
            name: newName,
            target: parseFloat(newTarget),
            saved: parseFloat(newSaved) || 0,
            deadline: newDeadline
        });
        showToast('Savings goal added!', 'success');
        setNewName('');
        setNewTarget('');
        setNewSaved(0);
        setNewDeadline('');
        await loadAll();
    };

    // REPLACED: This function (was broken, now fixed)
    const openSavingsContrib = (id) => {
        setContributingId(id);
        setContribAmount('');
        setSelectedAccount('');
    };

    // NEW FUNCTION: Handles the actual transfer
    const addToSavings = async () => {
        if (!contribAmount || parseFloat(contribAmount) <= 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }
        if (!selectedAccount) {
            showToast('Please select an account', 'error');
            return;
        }

        const amount = parseFloat(contribAmount);
        const account = state.accounts?.find(acc => acc.id === parseInt(selectedAccount));
        
        if (!account || account.balance < amount) {
            showToast(`Insufficient balance in ${account?.name || 'account'}`, 'error');
            return;
        }

        try {
            await API('POST', '/expenses', {
                item: `Transfer to savings: ${state.savings.find(s => s.id === contributingId)?.name}`,
                amount: amount,
                account_id: account.id,
                date: new Date().toISOString().split('T')[0],
                notes: 'Transfer to savings goal',
                type: 'transfer'
            });

            await API('PUT', `/savings/${contributingId}`, { amount: amount });
            
            showToast(`Added ${fmt(amount)} to savings!`, 'success');
            setContributingId(null);
            setContribAmount('');
            setSelectedAccount('');
            await loadAll();
        } catch (error) {
            showToast('Failed to add money', 'error');
        }
    };

    const deleteSavings = async (id) => {
        if (!window.confirm('Delete this savings goal?')) return;
        await API('DELETE', `/savings/${id}`);
        showToast('Deleted', 'success');
        await loadAll();
    };

    // CLOSE MODAL function
    const closeModal = () => {
        setContributingId(null);
        setContribAmount('');
        setSelectedAccount('');
    };

    return (
        <section id="savings" className="section active">
            <h2 className="section-title">Savings Goals</h2>

            <div className="card" style={{ marginBottom: '20px' }}>
                <h3>Add Savings Goal</h3>
                <div className="form-row">
                    <div className="form-group">
                        <label>Goal Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g., Vacation Fund"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Target Amount</label>
                        <input 
                            type="number" 
                            placeholder="100000"
                            value={newTarget}
                            onChange={(e) => setNewTarget(e.target.value)}
                        />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Already Saved</label>
                        <input 
                            type="number" 
                            value={newSaved}
                            onChange={(e) => setNewSaved(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Target Deadline</label>
                        <input 
                            type="date" 
                            value={newDeadline}
                            onChange={(e) => setNewDeadline(e.target.value)}
                        />
                    </div>
                </div>
                <button className="btn btn-green" onClick={addSavingsGoal}>Add Goal</button>
            </div>

            <div id="savingsList">
                {state.savings?.length > 0 ? state.savings.map(g => {
                    const pct = Math.min(Math.round((g.saved / g.target) * 100), 100);
                    const done = g.saved >= g.target;

                    return (
                        <div className="savings-item" key={g.id}>
                            <div className="account-header">
                                <span className="account-name">
                                    {g.name} {done && '✅'}
                                </span>
                                <span className="positive">
                                    {fmt(g.saved)} / {fmt(g.target)}
                                </span>
                            </div>
                            {g.deadline && (
                                <div style={{ fontSize: '13px', color: '#777' }}>
                                    Target: {g.deadline}
                                </div>
                            )}
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ 
                                        width: `${pct}%`, 
                                        background: done ? '#27ae60' : '#3498db' 
                                    }}
                                ></div>
                            </div>
                            <div style={{ fontSize: '12px', color: '#777', marginTop: '4px' }}>
                                {pct}% reached {done && '— Goal achieved! 🎉'}
                            </div>
                            <div style={{ marginTop: '10px' }}>
                                {!done && (
                                    <button 
                                        className="btn btn-small btn-green" 
                                        onClick={() => openSavingsContrib(g.id)}
                                    >
                                        + Add Savings
                                    </button>
                                )}
                                <button 
                                    className="btn btn-small btn-red" 
                                    onClick={() => deleteSavings(g.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    );
                }) : (
                    <p style={{ color: '#777', padding: '20px' }}>No savings goals yet.</p>
                )}
            </div>

            {/* ONLY ADDITION: Modal HTML (30 lines) */}
            {contributingId && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeModal}>
                    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', maxWidth: '400px', width: '90%' }} onClick={e => e.stopPropagation()}>
                        <h3>Add Money to Savings</h3>
                        <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} style={{ width: '100%', padding: '8px', margin: '10px 0' }}>
                            <option value="">Select account...</option>
                            {state.accounts?.filter(acc => acc.type !== 'credit').map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name} - {fmt(acc.balance)}</option>
                            ))}
                        </select>
                        <input type="number" placeholder="Amount" value={contribAmount} onChange={e => setContribAmount(e.target.value)} style={{ width: '100%', padding: '8px', margin: '10px 0' }} />
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={closeModal}>Cancel</button>
                            <button onClick={addToSavings} className="btn btn-green">Add Money</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default Savings;