import React, { useState, useEffect } from 'react';
import AuthScreen from './components/AuthScreen';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Expenses from './components/Expenses';
import Categories from './components/Categories';
import Accounts from './components/Accounts';
import Income from './components/Income';
import Recurring from './components/Recurring';
import Emis from './components/Emis';
import Savings from './components/Savings';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import Toast from './components/Toast';
import API from './utils/api';

function App() {
    const [user, setUser] = useState(null);
    const [currency, setCurrency] = useState('₹');
    const [activeSection, setActiveSection] = useState('dashboard');
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
    const [state, setState] = useState({
        categories: [],
        accounts: [],
        expenses: [],
        incomeSources: [],
        recurring: [],
        emis: [],
        savings: []
    });

    useEffect(() => {
        checkAuth();
        const darkMode = localStorage.getItem('darkMode') === '1';
        if (darkMode) document.body.classList.add('dark');
    }, []);

    const checkAuth = async () => {
        const r = await API('GET', '/auth/me');
        if (r.authenticated) {
            loginSuccess(r.user);
        }
    };

    const loginSuccess = (userData) => {
        setUser(userData);
        setCurrency(userData.currency || '₹');
        initApp();
    };

    const initApp = async () => {
        await loadAll();
        showToast('Welcome back!', 'success');
    };

    const loadAll = async () => {
        const [cats, accs, incs, recs, emis, savs] = await Promise.all([
            API('GET', '/categories'), 
            API('GET', '/accounts'), 
            API('GET', '/income'),
            API('GET', '/recurring'), 
            API('GET', '/emis'), 
            API('GET', '/savings')
        ]);
        setState({
            categories: cats,
            accounts: accs,
            incomeSources: incs,
            recurring: recs,
            emis: emis,
            savings: savs,
            expenses: await API('GET', '/expenses')
        });
    };

    const showToast = (message, type = 'info') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000);
    };

    const fmt = (n) => currency + Number(n || 0).toLocaleString('en-IN');
    const today = () => new Date().toISOString().split('T')[0];

    const logout = async () => {
        await API('POST', '/auth/logout');
        setUser(null);
        window.location.reload();
    };

    const toggleDark = () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('darkMode', document.body.classList.contains('dark') ? '1' : '0');
    };

    if (!user) {
        return <AuthScreen onLoginSuccess={loginSuccess} />;
    }

    return (
        <div id="appShell" className="visible">
            <Header 
                user={user} 
                currency={currency} 
                onLogout={logout} 
                onToggleDark={toggleDark} 
            />
            <div className="layout-row">
                <Sidebar 
                    activeSection={activeSection} 
                    onSectionChange={setActiveSection} 
                    dueRecurring={state.recurring?.filter(r => r.next_date <= today()).length || 0}
                />
                <main className="page-content">
                    {activeSection === 'dashboard' && (
                        <Dashboard 
                            state={state} 
                            currency={currency} 
                            fmt={fmt} 
                            today={today}
                            loadAll={loadAll}
                            showToast={showToast}
                            setActiveSection={setActiveSection} 
                        />
                    )}

                    {activeSection === 'expenses' && (
                        <Expenses 
                            state={state}
                            currency={currency}
                            fmt={fmt}
                            today={today}
                            loadAll={loadAll}
                            showToast={showToast}
                        />
                    )}
                    {activeSection === 'categories' && (
                        <Categories 
                            state={state}
                            currency={currency}
                            fmt={fmt}
                            today={today}
                            loadAll={loadAll}
                            showToast={showToast}
                        />
                    )}
                    {activeSection === 'accounts' && (
                        <Accounts 
                            state={state}
                            currency={currency}
                            fmt={fmt}
                            loadAll={loadAll}
                            showToast={showToast}
                        />
                    )}
                    {activeSection === 'income' && (
                        <Income 
                            state={state}
                            currency={currency}
                            fmt={fmt}
                            loadAll={loadAll}
                            showToast={showToast}
                        />
                    )}
                    {activeSection === 'recurring' && (
                        <Recurring 
                            state={state}
                            currency={currency}
                            fmt={fmt}
                            today={today}
                            loadAll={loadAll}
                            showToast={showToast}
                        />
                    )}
                    {activeSection === 'emis' && (
                        <Emis 
                            state={state}
                            currency={currency}
                            fmt={fmt}
                            loadAll={loadAll}
                            showToast={showToast}
                        />
                    )}
                    {activeSection === 'savings' && (
                        <Savings 
                            state={state}
                            currency={currency}
                            fmt={fmt}
                            loadAll={loadAll}
                            showToast={showToast}
                        />
                    )}
                    {activeSection === 'analytics' && (
                        <Analytics 
                            currency={currency}
                            fmt={fmt}
                            today={today}
                        />
                    )}
                    {activeSection === 'settings' && (
                        <Settings 
                            user={user}
                            currency={currency}
                            onUserUpdate={setUser}
                            showToast={showToast}
                            loadAll={loadAll}
                        />
                    )}
                </main>
            </div>
            <footer className="site-footer">
                <p>Made By: Shubankar Sridhar, Email address: shubankar.s.06@gmail.com</p>
            </footer>

        </div>
    );
}

export default App;