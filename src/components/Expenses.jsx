import React, { useState, useEffect, useCallback, useRef } from 'react';
import API from '../utils/api';

function Expenses({ state, currency, fmt, today, loadAll, showToast }) {
    const [filterMonth, setFilterMonth] = useState(today().slice(0, 7));
    const [filterCat, setFilterCat] = useState('');
    const [filteredExpenses, setFilteredExpenses] = useState([]);
    
    const [showModal, setShowModal] = useState(false);
    const [item, setItem] = useState('');
    const [qty, setQty] = useState('1');
    const [unitPrice, setUnitPrice] = useState('');
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [accountId, setAccountId] = useState('');
    const [date, setDate] = useState(today());
    const [notes, setNotes] = useState('');
    
    const isManualAmountRef = useRef(false);
    
    useEffect(() => {
        loadFilteredExpenses();
    }, [state.expenses, filterMonth, filterCat]);

    
    useEffect(() => {
        if (showModal) {
            setDate(today());
            if (state.categories.length > 0 && !categoryId) {
                const defaultCat = state.categories.find(c => c.name === 'Shopping');
                setCategoryId(defaultCat?.id || state.categories[0]?.id);
            }
            if (state.accounts.length > 0 && !accountId) {
                const defaultAcc = state.accounts.find(a => a.name === 'Cash');
                setAccountId(defaultAcc?.id || state.accounts[0]?.id);
            }
        }
    }, [showModal, state.categories, state.accounts]);

    const loadFilteredExpenses = () => {
        let filtered = state.expenses?.filter(e => e.type === 'expense') || [];
        if (filterMonth) {
            filtered = filtered.filter(e => e.date.slice(0, 7) === filterMonth);
        }
        if (filterCat) {
            filtered = filtered.filter(e => String(e.category_id) === filterCat);
        }
        setFilteredExpenses(filtered);
    };

    const deleteExpense = async (id) => {
        if (!window.confirm('Delete this expense?')) return;
        const r = await API('DELETE', `/expenses/${id}`);
        if (r.success) {
            showToast('Expense deleted', 'success');
            await loadAll();
        }
    };

    
    const openModal = () => {
        setItem('');
        setQty('1');
        setUnitPrice('');
        setAmount('');
        setNotes('');
        isManualAmountRef.current = false;
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        isManualAmountRef.current = false;
    };

    
    const calculateTotalFromQtyAndPrice = useCallback(() => {
        if (isManualAmountRef.current) return;
        const qtyNum = parseFloat(qty);
        const priceNum = parseFloat(unitPrice);
        
        if (!isNaN(qtyNum) && !isNaN(priceNum) && qtyNum > 0 && priceNum > 0) {
            const total = qtyNum * priceNum;
            setAmount(total.toString());
        } else if (unitPrice === '' || unitPrice === '0') {    
            setAmount('');
        }
    }, [qty, unitPrice]);

    useEffect(() => {
        calculateTotalFromQtyAndPrice();
    }, [qty, unitPrice, calculateTotalFromQtyAndPrice]);

    const clearUnitCalc = () => {
        isManualAmountRef.current = true;
        setQty('1');
        setUnitPrice('');
    };

    const saveExpense = async () => {
        if (!item || !amount || !accountId) {
            showToast('Please fill all required fields', 'error');
            return;
        }
        
        const expenseData = {
            item,
            amount: parseFloat(amount),
            category_id: categoryId || null,
            account_id: accountId,
            date,
            notes,
            quantity: parseFloat(qty) || 1,
            unit_price: parseFloat(unitPrice) || 0,
            type: 'expense'
        };
        
        const r = await API('POST', '/expenses', expenseData);
        if (r.error) {
            showToast(r.error, 'error');
        } else {
            showToast('Expense added!', 'success');
            closeModal();
            await loadAll();
        }
    };


    const useTemplate = (type) => {
        const templates = {
            fuel: { item: 'Fuel', qty: 1, unit: 1000, cat: 'Transportation', amount: 1000 },
            grocery: {  item: 'Groceries', qty: 1, unit: 1500, cat: 'Food & Dining',amount: 1500},
            food: { item: 'Restaurant',  qty: 1,  unit: 500, cat: 'Food & Dining', amount: 500},
            shopping: {  item: 'Shopping',  qty: 1,  unit: 2000,  cat: 'Shopping', amount: 2000 }
        };
        
        const tmpl = templates[type];
        if (!tmpl) return;
        
        const category = state.categories.find(c => 
            c.name.toLowerCase().includes(tmpl.cat.toLowerCase())
        );
        
        setItem(tmpl.item);
        setQty(tmpl.qty.toString());
        setUnitPrice(tmpl.unit.toString());
        setAmount(tmpl.amount.toString());
        if (category) { setCategoryId(category.id);}
        isManualAmountRef.current = false;
        setShowModal(true);
    };

    
    const handleQtyChange = (e) => {
        const value = e.target.value;
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setQty(value);
        
            isManualAmountRef.current = false;
        }
    };

    const handlePriceChange = (e) => {
        const value = e.target.value;
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setUnitPrice(value);
            isManualAmountRef.current = false;
        }
    };

    const handleAmountChange = (e) => {
        const value = e.target.value;
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setAmount(value);
            isManualAmountRef.current = true;
            if (value !== '') {
                setQty('1');
                setUnitPrice('');
            }
        }
    };

    return (
        <section id="expenses" className="section active">
            <h2 className="section-title">Expenses</h2>
            <div className="quick-actions">
                <button className="btn btn-green" onClick={openModal}>+ Add New Expense</button>
            </div>
            <h3>Quick Templates</h3>
            <div className="quick-actions">
                <button className="btn btn-small" onClick={() => useTemplate('fuel')}>Fuel</button>
                <button className="btn btn-small" onClick={() => useTemplate('grocery')}>Groceries</button>
                <button className="btn btn-small" onClick={() => useTemplate('food')}>Food</button>
                <button className="btn btn-small" onClick={() => useTemplate('shopping')}>Shopping</button>
            </div>
            <h3>All Expenses</h3>
            <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input 
                    type="month" 
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    style={{ padding: '7px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                <select 
                    value={filterCat}
                    onChange={(e) => setFilterCat(e.target.value)}
                    style={{ padding: '7px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                    <option value="">All Categories</option>
                    {state.categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Item</th>
                        <th>Qty × Price</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Account</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredExpenses.length > 0 ? filteredExpenses.map(e => (
                        <tr key={e.id}>
                            <td>{e.date}</td>
                            <td>{e.item}</td>
                            <td style={{ color: '#777', fontSize: '12px' }}>
                                {e.quantity && e.unit_price ? `${e.quantity}×${fmt(e.unit_price)}` : '—'}
                            </td>
                            <td>{e.category_name || 'Other'}</td>
                            <td>{fmt(e.amount)}</td>
                            <td>{e.account_name || '—'}</td>
                            <td>
                                <button 
                                    className="btn btn-small btn-red" 
                                    onClick={() => deleteExpense(e.id)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="7" style={{ color: '#777', textAlign: 'center' }}>
                                No expenses found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {showModal && (
                <div className="modal show" style={{ display: 'flex' }}>
                    <div className="modal-content">
                        <h3 className="modal-title">Add Expense</h3>
                        
                        <div className="form-group">
                            <label>Item Name</label>
                            <input 
                                type="text" 
                                placeholder="e.g., Coffee"
                                value={item}
                                onChange={(e) => setItem(e.target.value)}
                            />
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Quantity</label>
                                <input 
                                    type="text"
                                    value={qty}
                                    onChange={handleQtyChange}
                                    placeholder="1"
                                />
                            </div>
                            <div className="form-group">
                                <label>Unit Price ({currency})</label>
                                <input 
                                    type="text"
                                    value={unitPrice}
                                    onChange={handlePriceChange}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Total Amount ({currency})</label>
                                <input 
                                    type="text"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    placeholder="0"
                                />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select 
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                >
                                    <option value="">Select Category</option>
                                    {state.categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Account</label>
                                <select 
                                    value={accountId}
                                    onChange={(e) => setAccountId(e.target.value)}
                                >
                                    <option value="">Select Account</option>
                                    {state.accounts.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.name} ({fmt(a.balance)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input 
                                    type="date" 
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Notes (optional)</label>
                            <textarea 
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any notes here..."
                            ></textarea>
                        </div>
                        
                        <div className="modal-actions">
                            <button className="btn" onClick={closeModal}>Cancel</button>
                            <button className="btn btn-green" onClick={saveExpense}>Save Expense</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default Expenses;