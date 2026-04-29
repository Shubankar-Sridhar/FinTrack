import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, ArcElement, LineElement, PointElement, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import API from '../utils/api';

ChartJS.register(
    BarElement, CategoryScale, LinearScale, ArcElement, 
    LineElement, PointElement, Tooltip, Legend, Filler
);

function Analytics({ currency, fmt, today }) {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(today().slice(0, 7));
    const [monthlyData, setMonthlyData] = useState({ labels: [], incomes: [], expenses: [] });
    const [categoryData, setCategoryData] = useState({ labels: [], values: [] });
    const [dailyData, setDailyData] = useState({ labels: [], values: [] });
    const [stats, setStats] = useState({
        totalExpenses: 0,
        totalIncome: 0,
        avgMonthly: 0,
        topCategory: { name: '—', total: 0 }
    });

    useEffect(() => {
        loadAnalytics();
    }, [year, month]);

    const loadAnalytics = async () => {
        const [monthly, category, daily] = await Promise.all([
            API('GET', `/analytics/monthly?year=${year}`),
            API('GET', `/analytics/category?month=${month}`),
            API('GET', `/analytics/daily?month=${month}`)
        ]);

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const expArr = Array(12).fill(0);
        const incArr = Array(12).fill(0);
        monthly.forEach(r => {
            const m = parseInt(r.month) - 1;
            if (r.type === 'expense') expArr[m] += r.total;
            if (r.type === 'income') incArr[m] += r.total;
        });
        setMonthlyData({
            labels: months,
            incomes: incArr,
            expenses: expArr
        });

        setCategoryData({
            labels: category.map(c => c.name || 'Other'),
            values: category.map(c => c.total)
        });

        setDailyData({
            labels: daily.map(d => d.date.slice(5)),
            values: daily.map(d => d.total)
        });

        const totalExp = expArr.reduce((a, b) => a + b, 0);
        const totalInc = incArr.reduce((a, b) => a + b, 0);
        const avgMonthly = totalExp / 12;
        const topCat = category[0] || { name: '—', total: 0 };
        setStats({
            totalExpenses: totalExp,
            totalIncome: totalInc,
            avgMonthly: avgMonthly,
            topCategory: topCat
        });
    };

    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= currentYear - 5; y--) {
        years.push(y);
    }

    const barOptions = {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true } }
    };

    const doughnutOptions = {
        responsive: true,
        plugins: { legend: { position: 'right' } }
    };

    const lineOptions = {
        responsive: true,
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { display: false } }
    };

    const colors = [
        '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', 
        '#1abc9c', '#e67e22', '#34495e', '#e91e63', '#00bcd4'
    ];

    return (
        <section id="analytics" className="section active">
            <h2 className="section-title">Analytics & Reports</h2>
            
            <div className="analytics-filters">
                <label>Year:</label>
                <select 
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                >
                    {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
                <label>Month:</label>
                <input 
                    type="month" 
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                />
            </div>

            <div className="chart-grid">
                <div className="chart-card">
                    <h4>📊 Monthly Income vs Expenses</h4>
                    <Bar 
                        data={{
                            labels: monthlyData.labels,
                            datasets: [
                                { 
                                    label: 'Income', 
                                    data: monthlyData.incomes, 
                                    backgroundColor: 'rgba(39,174,96,.75)', 
                                    borderRadius: 4 
                                },
                                { 
                                    label: 'Expenses', 
                                    data: monthlyData.expenses, 
                                    backgroundColor: 'rgba(231,76,60,.75)', 
                                    borderRadius: 4 
                                }
                            ]
                        }}
                        options={barOptions}
                    />
                </div>

                <div className="chart-card">
                    <h4>Spending by Category</h4>
                    <Doughnut 
                        data={{
                            labels: categoryData.labels,
                            datasets: [
                                { 
                                    data: categoryData.values, 
                                    backgroundColor: colors 
                                }
                            ]
                        }}
                        options={doughnutOptions}
                    />
                </div>

                <div className="chart-card chart-full">
                    <h4>Daily Spending This Month</h4>
                    <Line 
                        data={{
                            labels: dailyData.labels,
                            datasets: [
                                { 
                                    label: 'Daily Spend', 
                                    data: dailyData.values, 
                                    fill: true, 
                                    backgroundColor: 'rgba(252,152,59,.30)', 
                                    borderColor: '#fd9e12', 
                                    tension: 0.35, 
                                    pointRadius: 4 
                                }
                            ]
                        }}
                        options={lineOptions}
                    />
                </div>
            </div>

            <div className="card-grid" id="analyticsStats">
                <div className="card">
                    <h3>Total Expenses {year}</h3>
                    <div className="card-value negative">{fmt(stats.totalExpenses)}</div>
                </div>
                <div className="card">
                    <h3>Total Income {year}</h3>
                    <div className="card-value positive">{fmt(stats.totalIncome)}</div>
                </div>
                <div className="card">
                    <h3>Avg Monthly Spend</h3>
                    <div className="card-value">{fmt(stats.avgMonthly)}</div>
                </div>
                <div className="card">
                    <h3>Top Category ({month})</h3>
                    <div className="card-value" style={{ fontSize: '18px' }}>
                        {stats.topCategory.name}
                    </div>
                    <div className="card-small">{fmt(stats.topCategory.total)}</div>
                </div>
            </div>
        </section>
    );
}

export default Analytics;