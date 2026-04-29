import React, { useState } from 'react';
import API from '../utils/api';

function AuthScreen({ onLoginSuccess }) {
    const [activeTab, setActiveTab] = useState('login');
    const [error, setError] = useState('');

    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regCurrency, setRegCurrency] = useState('₹');
    const [regSalary, setRegSalary] = useState('');

    const doLogin = async () => {
        if (!loginEmail || !loginPassword) {
            setError('Please fill all fields');
            return;
        }
        const r = await API('POST', '/auth/login', { email: loginEmail, password: loginPassword });
        if (r.error) {
            setError(r.error);
        } else {
            onLoginSuccess(r);
        }
    };

    const doRegister = async () => {
        if (!regName || !regEmail || !regPassword) {
            setError('Please fill all fields');
            return;
        }
        const r = await API('POST', '/auth/register', {
            name: regName,
            email: regEmail,
            password: regPassword,
            currency: regCurrency,
            salary: parseFloat(regSalary) || 0
        });
        if (r.error) {
            setError(r.error);
        } else {
            onLoginSuccess(r);
        }
    };

    return (
        <div id="authScreen">
            <div className="auth-box">
                <div className="auth-logo">FinTrack - Unified Expense Tracker</div>
                <div className="auth-sub">A VIT Chennai Student Initiative</div>
                <div className="auth-tabs">
                    <div 
                        className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('login')}
                    >
                        Login
                    </div>
                    <div 
                        className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('register')}
                    >
                        Register
                    </div>
                </div>
                {error && <div className="auth-error" style={{ display: 'block' }}>{error}</div>}

                {activeTab === 'login' && (
                    <div id="loginForm" className="auth-form active">
                        <div className="form-group">
                            <label>Email</label>
                            <input 
                                type="email" 
                                placeholder="you@example.com" 
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input 
                                type="password" 
                                placeholder="••••••••" 
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                            />
                        </div>
                        <button className="auth-btn" onClick={doLogin}>Sign In</button>
                    </div>
                )}

                {activeTab === 'register' && (
                    <div id="registerForm" className="auth-form active">
                        <div className="auth-form-row">
                            <div className="form-group">
                                <label>Your Name</label>
                                <input 
                                    type="text" 
                                    placeholder="Arjun Sharma"
                                    value={regName}
                                    onChange={(e) => setRegName(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Currency</label>
                                <select 
                                    value={regCurrency}
                                    onChange={(e) => setRegCurrency(e.target.value)}
                                >
                                    <option value="₹">₹ Indian Rupee</option>
                                    <option value="$">$ US Dollar</option>
                                    <option value="€">€ Euro</option>
                                    <option value="£">£ British Pound</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input 
                                type="email" 
                                placeholder="you@example.com"
                                value={regEmail}
                                onChange={(e) => setRegEmail(e.target.value)}
                            />
                        </div>
                        <div className="auth-form-row">
                            <div className="form-group">
                                <label>Password</label>
                                <input 
                                    type="password" 
                                    placeholder="••••••••"
                                    value={regPassword}
                                    onChange={(e) => setRegPassword(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Monthly Salary</label>
                                <input 
                                    type="number" 
                                    placeholder="50000"
                                    value={regSalary}
                                    onChange={(e) => setRegSalary(e.target.value)}
                                />
                            </div>
                        </div>
                        <button className="auth-btn" onClick={doRegister}>Create Account</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AuthScreen;