import React from 'react';

function Header({ user, currency, onLogout, onToggleDark }) {
    return (
        <header className="site-header">
            <div className="logo">FinTrack - A Unified Expense Tracker</div>
            <div className="header-right">
                <span id="userName">{user.name}</span>
                <span style={{ opacity: '.7', fontSize: '13px' }}>{currency}</span>
                <button className="btn-logout" onClick={onToggleDark} title="Toggle dark mode">
                    ☀️🌙
                </button>
                <button className="btn-logout" onClick={onLogout}>Logout</button>
            </div>
        </header>
    );
}

export default Header;