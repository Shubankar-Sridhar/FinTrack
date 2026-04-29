import React from 'react';

function Sidebar({ activeSection, onSectionChange, dueRecurring }) {
    const sections = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'expenses', label: 'Expenses' },
        { id: 'categories', label: 'Categories' },
        { id: 'accounts', label: 'Accounts' },
        { id: 'income', label: 'Income' },
        { id: 'recurring', label: 'Recurring', badge: dueRecurring },
        { id: 'emis', label: 'EMI / Loans' },
        { id: 'savings', label: 'Savings Goals' },
        { id: 'analytics', label: 'Analytics' },
        { id: 'settings', label: 'Settings' }
    ];

    return (
        <nav className="site-nav" aria-label="Main menu">
            <ul className="nav-menu">
                {sections.map(section => (
                    <li 
                        key={section.id}
                        className={activeSection === section.id ? 'active' : ''}
                        onClick={() => onSectionChange(section.id)}
                    >
                        <span className="nav-label">{section.label}</span>
                        {section.badge > 0 && (
                            <span className="nav-badge">{section.badge}</span>
                        )}
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default Sidebar;