/* Galilee Bible Class — Shared JS Utilities */

function toggleNav() {
    var links = document.getElementById('navLinks');
    if (links) {
        links.classList.toggle('show');
    }
}

// Close nav when clicking outside
document.addEventListener('click', function(e) {
    var nav = document.getElementById('navLinks');
    var toggle = document.querySelector('.nav-toggle');
    if (nav && nav.classList.contains('show') && !nav.contains(e.target) && e.target !== toggle) {
        nav.classList.remove('show');
    }
});

// Generic fetch helper
async function apiFetch(url, method, data) {
    var options = {
        method: method || 'GET',
        headers: {}
    };
    if (data && !(data instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(data);
    } else if (data instanceof FormData) {
        options.body = data;
    }
    var resp = await fetch(url, options);
    return await resp.json();
}

// Toast notification (simple)
function showToast(message, type) {
    var existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);' +
        'padding:1rem 1.5rem;border-radius:10px;font-weight:600;z-index:9999;' +
        'box-shadow:0 4px 20px rgba(0,0,0,0.15);max-width:90%;text-align:center;' +
        (type === 'error' ? 'background:#fef2f2;color:#dc2626;' : 'background:#dcfce7;color:#166534;');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 3000);
}
