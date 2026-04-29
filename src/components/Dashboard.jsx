import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import API from '../utils/api';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function Dashboard({ state, currency, fmt, today, loadAll, showToast, setActiveSection }) {
    const [summary, setSummary] = useState({
        total_balance: 0,
        monthly_income: 0,
        monthly_expenses: 0,
        savings_rate: 0,
        due_recurring: 0
    });
    const [recentExpenses, setRecentExpenses] = useState([]);
    const [chartData, setChartData] = useState({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            { label: 'Income', data: Array(12).fill(0), backgroundColor: 'rgba(39,174,96,.7)', borderRadius: 4 },
            { label: 'Expenses', data: Array(12).fill(0), backgroundColor: 'rgba(231,76,60,.7)', borderRadius: 4 }
        ]
    });

    useEffect(() => {
        loadSummary();
        loadRecentExpenses();
        loadChartData();
    }, [state.expenses]);

    const loadSummary = async () => {
        const s = await API('GET', '/analytics/summary');
        setSummary(s);
    };

    const loadRecentExpenses = () => {
        const recent = state.expenses
            ?.filter(e => e.type === 'expense')
            .sort((a, b) => b.id - a.id)  // ← Changed to ID sorting
            .slice(0, 5) || [];
        setRecentExpenses(recent);
    };
    const loadChartData = async () => {
        const yr = new Date().getFullYear();
        const data = await API('GET', `/analytics/monthly?year=${yr}`);
        const expArr = Array(12).fill(0);
        const incArr = Array(12).fill(0);
        data.forEach(r => {
            const m = parseInt(r.month) - 1;
            if (r.type === 'expense') expArr[m] += r.total;
            if (r.type === 'income') incArr[m] += r.total;
        });
        setChartData(prev => ({
            ...prev,
            datasets: [
                { ...prev.datasets[0], data: incArr },
                { ...prev.datasets[1], data: expArr }
            ]
        }));
    };

    const options = {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true } }
    };

    return (
        <section id="dashboard" className="section active">
            <h2 className="section-title">Dashboard</h2>
            <div className="card-grid">
                <div className="card">
                    <h3>Total Balance</h3>
                    <div className="card-value">{fmt(summary.total_balance)}</div>
                </div>
                <div className="card">
                    <h3>Monthly Income</h3>
                    <div className="card-value positive">{fmt(summary.monthly_income)}</div>
                </div>
                <div className="card">
                    <h3>Monthly Expenses</h3>
                    <div className="card-value negative">{fmt(summary.monthly_expenses)}</div>
                </div>
                <div className="card">
                    <h3>Savings Rate</h3>
                    <div className="card-value">{summary.savings_rate}%</div>
                </div>
            </div>

            <h3>Quick Actions</h3>
            <div className="quick-actions">
                <button className="btn" onClick={() => setActiveSection('expenses')}>
                    + Add Expense
                </button>
                <button className="btn btn-green" onClick={() => setActiveSection('income')}>
                    + Add Income
                </button>
                <button className="btn" onClick={() => setActiveSection('accounts')}>
                    Transfer Money
                </button>
                <button className="btn btn-orange" onClick={() => setActiveSection('analytics')}>
                    Analytics
                </button>
            </div>

            <div id="dashboardAlerts">
                {summary.due_recurring > 0 ? (
                    <div className="alert alert-warning">
                        ⚠️ You have {summary.due_recurring} recurring payment(s) due!
                    </div>
                ) : (
                    <div className="alert alert-success">All good! No alerts.</div>
                )}
            </div>

            <h3 style={{ marginTop: '20px' }}>Recent Expenses</h3>
            <table id="recentExpensesTable">
                <thead>
                    <tr><th>Date</th><th>Item</th><th>Category</th><th>Amount</th></tr>
                </thead>
                <tbody id="recentExpensesList">
                    {recentExpenses.length > 0 ? recentExpenses.map(e => (
                        <tr key={e.id}>
                            <td>{e.date}</td>
                            <td>{e.item}</td>
                            <td>{e.category_name || 'Other'}</td>
                            <td>{fmt(e.amount)}</td>
                        </tr>
                    )) : (
                        <tr><td colSpan="4" style={{ color: '#777', textAlign: 'center' }}>No expenses yet</td></tr>
                    )}
                </tbody>
            </table>

            <div className="chart-card" style={{ marginTop: '20px' }}>
                <h4>Monthly Spending Overview</h4>
                <Bar data={chartData} options={options} />
            </div>
        </section>
    );
}

export default Dashboard;