import React, { useState, useEffect } from 'react';
import API from '../utils/api';

function IncomeModal({ state, currency, today, loadAll, showToast }) {
    const [isOpen, setIsOpen] = useState(false);
    const [source, setSource] = useState('');
    const [amount, setAmount] = useState('');
    const [accountId, setAccountId] = useState('');
    const [date, setDate] = useState(today());

    useEffect(() => {
        if (isOpen) {
            setDate(today());
            if (state.accounts.length > 0 && !accountId) {
                const defaultAcc = state.accounts.find(a => a.name === 'Bank Account');
                setAccountId(defaultAcc?.id || state.accounts[0]?.id);
            }
        }
    }, [isOpen, state.accounts]);

    const saveIncome = async () => {
        if (!source || !amount || !accountId) {
            showToast('Please fill all fields', 'error');
            return;
        }
        const r = await API('POST', '/income/manual', {
            source,
            amount: parseFloat(amount),
            account_id: parseInt(accountId),
            date
        });
        if (r.error) {
            showToast(r.error, 'error');
        } else {
            showToast('Income added!', 'success');
            closeModal();
            await loadAll();
        }
    };

    const closeModal = () => {
        setIsOpen(false);
        setSource('');
        setAmount('');
    };

    useEffect(() => {
        const modal = document.getElementById('incomeModal');
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    setIsOpen(modal.classList.contains('show'));
                }
            });
        });
        if (modal) {
            observer.observe(modal, { attributes: true });
        }
        return () => observer.disconnect();
    }, []);

    if (!isOpen) return null;

    return (
        <div id="incomeModal" className="modal show">
            <div className="modal-content">
                <h3 className="modal-title">Add Income</h3>
                <div className="form-group">
                    <label>Source</label>
                    <input type="text" placeholder="e.g., Freelance Payment" value={source} onChange={(e) => setSource(e.target.value)}/>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Amount</label>
                        <input 
                            type="number" value={amount} onChange={(e) => setAmount(e.target.value)}/>
                    </div>
                    <div className="form-group">
                        <label>Account</label>
                        <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                            {state.accounts.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="form-group">
                    <label>Date</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    />
                </div>
                <div className="modal-actions">
                    <button className="btn" onClick={closeModal}>Cancel</button>
                    <button className="btn btn-green" onClick={saveIncome}>Add Income</button>
                </div>
            </div>
        </div>
    );
}

export default IncomeModal;