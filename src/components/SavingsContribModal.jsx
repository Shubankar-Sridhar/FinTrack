import React, { useState, useEffect } from 'react';
import API from '../utils/api';

function SavingsContribModal({ loadAll, showToast }) {
    const [isOpen, setIsOpen] = useState(false);
    const [goalId, setGoalId] = useState('');
    const [amount, setAmount] = useState('');

    const contributeSavings = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            showToast('Enter a valid amount', 'error');
            return;
        }
        await API('PUT', `/savings/${goalId}`, { amount: parseFloat(amount) });
        showToast('Savings updated!', 'success');
        closeModal();
        await loadAll();
    };

    const closeModal = () => {
        setIsOpen(false);
        setAmount('');
        setGoalId('');
    };

    useEffect(() => {
        const modal = document.getElementById('savingsContribModal');
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    setIsOpen(modal.classList.contains('show'));
                    if (modal.classList.contains('show')) {
                        setGoalId(document.getElementById('savingsContribId')?.value || '');
                    }
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
        <div id="savingsContribModal" className="modal show">
            <div className="modal-content">
                <h3 className="modal-title">Add to Savings Goal</h3>
                <input type="hidden" id="savingsContribId" value={goalId} readOnly />
                <div className="form-group">
                    <label>Amount to Add</label>
                    <input 
                        type="number" 
                        placeholder="5000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>
                <div className="modal-actions">
                    <button className="btn" onClick={closeModal}>Cancel</button>
                    <button className="btn btn-green" onClick={contributeSavings}>Add Amount</button>
                </div>
            </div>
        </div>
    );
}

export default SavingsContribModal;