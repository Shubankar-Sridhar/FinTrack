import React from 'react';

function Toast({ toast }) {
    if (!toast.show) return null;

    const background = toast.type === 'success' ? '#16a34a' : 
                       toast.type === 'error' ? '#dc2626' : '#0f172a';

    return (
        <div className="toast show" style={{ background }}>
            {toast.message}
        </div>
    );
}

export default Toast;