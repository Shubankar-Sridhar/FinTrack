import React, { useState, useEffect } from 'react';
import API from '../utils/api';

function Settings({ user, currency, onUserUpdate, showToast, loadAll }) {
    const [name, setName] = useState('');
    const [salary, setSalary] = useState('');
    const [currencySym, setCurrencySym] = useState('₹');

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setSalary(user.salary || '');
            setCurrencySym(user.currency || '₹');
        }
    }, [user]);

    const saveUserSettings = async () => {
        if (!name) {
            showToast('Please enter your name', 'error');
            return;
        }
        const r = await API('PUT', '/settings', {
            name,
            salary: parseFloat(salary) || 0,
            currency: currencySym
        });
        if (r.success) {
            onUserUpdate({ ...user, name, salary: parseFloat(salary) || 0, currency: currencySym });
            showToast('Settings saved!', 'success');
            await loadAll();
        }
    };

    const exportData = () => {
        window.location.href = '/api/data/export';
        showToast('Exporting data...', 'success');
    };

    const resetData = async () => {
        if (!window.confirm('This will delete ALL your data! Are you sure?')) return;
        const r = await API('POST', '/data/reset');
        if (r.success) {
            showToast('All data reset!', 'success');
            await loadAll();
        }
    };

    return (
        <section id="settings" className="section active">
            <h2 className="section-title">Settings</h2>

            <div className="card" style={{ marginBottom: '20px' }}>
                <h3>User Information</h3>
                <div className="form-row">
                    <div className="form-group">
                        <label>Your Name</label>
                        <input 
                            type="text" 
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Currency Symbol</label>
                        <select 
                            value={currencySym}
                            onChange={(e) => setCurrencySym(e.target.value)}
                        >
                            <option value="₹">₹ Indian Rupee</option>
                            <option value="$">$ US Dollar</option>
                            <option value="€">€ Euro</option>
                            <option value="£">£ British Pound</option>
                        </select>
                    </div>
                </div>
                <div className="form-group">
                    <label>Monthly Salary</label>
                    <input 
                        type="number" 
                        placeholder="0"
                        value={salary}
                        onChange={(e) => setSalary(e.target.value)}
                    />
                </div>
                <button className="btn" onClick={saveUserSettings}>Save Settings</button>
            </div>

            <div className="card" style={{ marginBottom: '20px', background: '#fef9e7' }}>
                <h3 style={{ color: '#92400e' }}>Data Management</h3>
                <p style={{ fontSize: '13px', color: '#92400e', marginBottom: '12px' }}>
                    All data is stored securely in a SQLite database on the server.
                </p>
                <button className="btn" onClick={exportData}>📤 Export JSON Backup</button>
                <button className="btn btn-red" onClick={resetData}>🗑️ Reset All Data</button>
            </div>
        </section>
    );
}

export default Settings;