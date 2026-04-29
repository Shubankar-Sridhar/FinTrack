const API = async (method, path, body = null) => {
    const opts = { 
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        credentials: 'include'
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch('/api' + path, opts);
    return res.json();
};

export default API;