import React, { useState } from 'react';
import API from '../utils/api';

function Categories({ state, currency, fmt, today, loadAll, showToast }) {
    const [newName, setNewName] = useState('');
    const [newBudget, setNewBudget] = useState('');

    const addCategory = async () => {
        if (!newName) {
            showToast('Please enter category name', 'error');
            return;
        }
        const r = await API('POST', '/categories', {
            name: newName,
            budget: parseFloat(newBudget) || 0
        });
        if (r.error) {
            showToast(r.error, 'error');
        } else {
            showToast('Category added!', 'success');
            setNewName('');
            setNewBudget('');
            await loadAll();
        }
    };

    const deleteCategory = async (id) => {
        if (!window.confirm('Delete this category?')) return;
        await API('DELETE', `/categories/${id}`);
        showToast('Category deleted', 'success');
        await loadAll();
    };

    const thisMonth = today().slice(0, 7);
    const expenses = state.expenses || [];

    return (
        <section id="categories" className="section active">
            <h2 className="section-title">Categories</h2>
            
            <div className="card" style={{ marginBottom: '20px' }}>
                <h3>Add New Category</h3>
                <div className="form-row">
                    <div className="form-group">
                        <label>Category Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g., Fuel"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Monthly Budget</label>
                        <input 
                            type="number" 
                            placeholder="0"
                            value={newBudget}
                            onChange={(e) => setNewBudget(e.target.value)}
                        />
                    </div>
                </div>
                <button className="btn" onClick={addCategory}>Add Category</button>
            </div>

            <div id="categoriesList">
                {state.categories.length > 0 ? state.categories.map(c => {
                    const spent = expenses
                        .filter(e => e.type === 'expense' && 
                                    String(e.category_id) === String(c.id) && 
                                    e.date.slice(0, 7) === thisMonth)
                        .reduce((sum, e) => sum + e.amount, 0);
                    const pct = c.budget > 0 ? Math.min((spent / c.budget) * 100, 100) : 0;
                    const over = c.budget > 0 && spent > c.budget;

                    return (
                        <div className="category-item" key={c.id}>
                            <div className="category-header">
                                <span className="category-name">{c.name}</span>
                                <span>Budget: {fmt(c.budget)}</span>
                            </div>
                            <div>
                                Spent this month: <strong className={over ? 'negative' : ''}>
                                    {fmt(spent)}
                                </strong> 
                                {over && (
                                    <span className="negative">(over by {fmt(spent - c.budget)})</span>
                                )}
                            </div>
                            <div className="progress-bar">
                                <div 
                                    className={`progress-fill ${over ? 'warning' : ''}`} 
                                    style={{ width: `${pct}%` }}
                                ></div>
                            </div>
                            <button 
                                className="btn btn-small btn-red" 
                                onClick={() => deleteCategory(c.id)}
                                style={{ marginTop: '10px' }}
                            >
                                Delete
                            </button>
                        </div>
                    );
                }) : (
                    <p style={{ color: '#777', padding: '20px' }}>No categories yet.</p>
                )}
            </div>
        </section>
    );
}

export default Categories;