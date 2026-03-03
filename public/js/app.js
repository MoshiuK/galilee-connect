/**
 * Galilee Connect - Frontend JavaScript
 */

// ==================== TOAST NOTIFICATIONS ====================

function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==================== MODAL ====================

function showModal(title, content, onSave) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
        <div class="modal-content p-6">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-display font-bold text-purple-900">${title}</h3>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div id="modal-body">${content}</div>
        </div>
    `;
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
    document.body.appendChild(overlay);
}

function closeModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 200);
    }
}

// ==================== API HELPERS ====================

async function apiCall(url, options = {}) {
    const defaults = {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin'
    };

    const config = { ...defaults, ...options };
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
        config.body = JSON.stringify(options.body);
    }
    if (options.body instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (err) {
        showToast(err.message, 'error');
        throw err;
    }
}

// ==================== MEMBER MANAGEMENT ====================

async function loadMembers(searchQuery = '') {
    const container = document.getElementById('members-table-body');
    if (!container) return;

    try {
        const data = await apiCall(`/api/members?search=${encodeURIComponent(searchQuery)}`);
        renderMembersTable(data.members);
    } catch (err) {
        container.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-500">Failed to load members</td></tr>';
    }
}

function renderMembersTable(members) {
    const container = document.getElementById('members-table-body');
    if (!container) return;

    if (members.length === 0) {
        container.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-500">No members found</td></tr>';
        return;
    }

    container.innerHTML = members.map(m => `
        <tr class="border-b border-gray-100">
            <td class="px-4 py-3">
                <div class="font-medium text-gray-900">${escapeHtml(m.first_name)} ${escapeHtml(m.last_name)}</div>
            </td>
            <td class="px-4 py-3 text-gray-600">${escapeHtml(m.email || '—')}</td>
            <td class="px-4 py-3 text-gray-600">${escapeHtml(m.phone || '—')}</td>
            <td class="px-4 py-3 text-gray-600">${formatMMDD(m.birthday)}</td>
            <td class="px-4 py-3 text-gray-600">${formatMMDD(m.anniversary)}</td>
            <td class="px-4 py-3">
                <span class="badge ${m.email_subscribed ? 'badge-success' : 'badge-danger'}">
                    ${m.email_subscribed ? '✉️ Yes' : '✉️ No'}
                </span>
            </td>
            <td class="px-4 py-3">
                <div class="flex gap-2">
                    <button onclick="editMember(${m.id})" class="text-purple-700 hover:text-purple-900 text-sm font-medium">Edit</button>
                    <button onclick="deleteMember(${m.id}, '${escapeHtml(m.first_name)} ${escapeHtml(m.last_name)}')"
                        class="text-red-500 hover:text-red-700 text-sm font-medium">Remove</button>
                </div>
            </td>
        </tr>
    `).join('');

    // Update count
    const countEl = document.getElementById('member-count');
    if (countEl) countEl.textContent = members.length;
}

function showAddMemberModal() {
    const content = getMemberFormHTML();
    showModal('Add New Member', content);
}

async function editMember(id) {
    try {
        const data = await apiCall(`/api/members/${id}`);
        const m = data.member;
        const content = getMemberFormHTML(m);
        showModal('Edit Member', content);
    } catch (err) {
        showToast('Failed to load member details', 'error');
    }
}

function getMemberFormHTML(member = null) {
    const m = member || {};
    const birthdayParts = m.birthday ? m.birthday.split('-') : ['', ''];
    const anniversaryParts = m.anniversary ? m.anniversary.split('-') : ['', ''];

    return `
        <form id="member-form" onsubmit="saveMember(event, ${m.id || 'null'})">
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input type="text" name="first_name" value="${escapeHtml(m.first_name || '')}" required
                        class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input type="text" name="last_name" value="${escapeHtml(m.last_name || '')}" required
                        class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="email" value="${escapeHtml(m.email || '')}"
                        class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="tel" name="phone" value="${escapeHtml(m.phone || '')}"
                        class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Birthday (Month/Day)</label>
                    <div class="flex gap-2">
                        <select name="birthday_month" class="form-input flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Month</option>
                            ${getMonthOptions(birthdayParts[0])}
                        </select>
                        <select name="birthday_day" class="form-input flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Day</option>
                            ${getDayOptions(birthdayParts[1])}
                        </select>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Anniversary (Month/Day)</label>
                    <div class="flex gap-2">
                        <select name="anniversary_month" class="form-input flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Month</option>
                            ${getMonthOptions(anniversaryParts[0])}
                        </select>
                        <select name="anniversary_day" class="form-input flex-1 px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Day</option>
                            ${getDayOptions(anniversaryParts[1])}
                        </select>
                    </div>
                </div>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
                <input type="date" name="join_date" value="${m.join_date || ''}"
                    class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea name="notes" rows="2"
                    class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg">${escapeHtml(m.notes || '')}</textarea>
            </div>
            <div class="flex justify-end gap-3">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                <button type="submit" class="btn-primary px-6 py-2 rounded-lg font-medium">${member ? 'Save Changes' : 'Add Member'}</button>
            </div>
        </form>
    `;
}

async function saveMember(event, id) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const birthday_month = formData.get('birthday_month');
    const birthday_day = formData.get('birthday_day');
    const anniversary_month = formData.get('anniversary_month');
    const anniversary_day = formData.get('anniversary_day');

    const data = {
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        birthday: birthday_month && birthday_day ? `${birthday_month.padStart(2, '0')}-${birthday_day.padStart(2, '0')}` : null,
        anniversary: anniversary_month && anniversary_day ? `${anniversary_month.padStart(2, '0')}-${anniversary_day.padStart(2, '0')}` : null,
        join_date: formData.get('join_date'),
        notes: formData.get('notes')
    };

    try {
        if (id) {
            await apiCall(`/api/members/${id}`, { method: 'PUT', body: data });
            showToast('Member updated successfully');
        } else {
            await apiCall('/api/members', { method: 'POST', body: data });
            showToast('Member added successfully');
        }
        closeModal();
        loadMembers();
    } catch (err) {
        // Error already shown by apiCall
    }
}

async function deleteMember(id, name) {
    if (!confirm(`Are you sure you want to remove ${name} from the member list?`)) return;

    try {
        await apiCall(`/api/members/${id}`, { method: 'DELETE' });
        showToast(`${name} has been removed`);
        loadMembers();
    } catch (err) {
        // Error shown by apiCall
    }
}

// ==================== CSV IMPORT ====================

function showImportModal() {
    const content = `
        <div class="mb-4">
            <p class="text-gray-600 mb-3">Upload a CSV file with member information. The file should have headers like:
                <code class="bg-gray-100 px-1 rounded text-sm">first_name, last_name, email, phone, birthday, anniversary</code>
            </p>
            <form id="import-form" onsubmit="importCSV(event)" enctype="multipart/form-data">
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
                    <input type="file" name="csvfile" accept=".csv" required id="csv-file-input"
                        class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100">
                </div>
                <div class="flex justify-end gap-3">
                    <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-600">Cancel</button>
                    <button type="submit" class="btn-primary px-6 py-2 rounded-lg font-medium">Import</button>
                </div>
            </form>
        </div>
        <div id="import-results" class="hidden mt-4 p-4 bg-green-50 rounded-lg"></div>
    `;
    showModal('Import Members from CSV', content);
}

async function importCSV(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    try {
        const response = await fetch('/api/members/import', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });
        const data = await response.json();

        if (data.success) {
            const resultsDiv = document.getElementById('import-results');
            resultsDiv.className = 'mt-4 p-4 bg-green-50 rounded-lg';
            resultsDiv.innerHTML = `
                <p class="font-medium text-green-800">Import Complete!</p>
                <p class="text-green-700">✅ ${data.imported} members imported</p>
                ${data.skipped > 0 ? `<p class="text-yellow-700">⚠️ ${data.skipped} skipped (duplicate or missing data)</p>` : ''}
            `;
            showToast(`${data.imported} members imported!`);
            loadMembers();
        } else {
            showToast(data.error || 'Import failed', 'error');
        }
    } catch (err) {
        showToast('Import failed: ' + err.message, 'error');
    }
}

// ==================== MESSAGES ====================

async function loadMessages(page = 1) {
    const container = document.getElementById('messages-table-body');
    if (!container) return;

    try {
        const data = await apiCall(`/api/messages?page=${page}&limit=25`);
        renderMessagesTable(data.messages, data.pagination);
    } catch (err) {
        container.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">Failed to load messages</td></tr>';
    }
}

function renderMessagesTable(messages, pagination) {
    const container = document.getElementById('messages-table-body');
    if (!container) return;

    if (messages.length === 0) {
        container.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">No messages sent yet</td></tr>';
        return;
    }

    container.innerHTML = messages.map(m => {
        const typeIcon = {
            'bible_verse': '📖',
            'birthday': '🎂',
            'anniversary': '💒',
            'manual': '✉️'
        }[m.message_type] || '📧';

        const statusBadge = m.status === 'sent'
            ? '<span class="badge badge-success">Sent</span>'
            : '<span class="badge badge-danger">Failed</span>';

        return `
            <tr class="border-b border-gray-100">
                <td class="px-4 py-3">${typeIcon} ${escapeHtml(m.message_type)}</td>
                <td class="px-4 py-3 font-medium">${escapeHtml(m.member_name || 'Unknown')}</td>
                <td class="px-4 py-3 text-gray-600">${escapeHtml(m.channel)}</td>
                <td class="px-4 py-3 text-gray-600">${escapeHtml(m.subject || m.body?.substring(0, 50) || '—')}</td>
                <td class="px-4 py-3">${statusBadge}</td>
                <td class="px-4 py-3 text-gray-500 text-sm">${formatDate(m.sent_at)}</td>
            </tr>
        `;
    }).join('');

    // Pagination
    const paginationEl = document.getElementById('messages-pagination');
    if (paginationEl && pagination && pagination.pages > 1) {
        let html = '<div class="flex justify-center gap-2 mt-4">';
        for (let i = 1; i <= pagination.pages; i++) {
            const active = i === pagination.page ? 'bg-purple-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200';
            html += `<button onclick="loadMessages(${i})" class="${active} px-3 py-1 rounded-lg text-sm">${i}</button>`;
        }
        html += '</div>';
        paginationEl.innerHTML = html;
    }
}

function showSendMessageModal() {
    const content = `
        <form id="send-message-form" onsubmit="sendMessage(event)">
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
                <select id="message-recipients" class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="all">All Active Members</option>
                </select>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                <select name="channel" class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                </select>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input type="text" name="subject" required
                    class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Message subject...">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <p class="text-xs text-gray-500 mb-1">Use {{first_name}}, {{last_name}}, {{full_name}} for personalization</p>
                <textarea name="message" rows="5" required
                    class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Dear {{first_name}}, ..."></textarea>
            </div>
            <div class="flex justify-end gap-3">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" class="btn-primary px-6 py-2 rounded-lg font-medium">Send Message</button>
            </div>
        </form>
    `;
    showModal('Send Message', content);

    // Load member list for selection
    loadMemberOptions();
}

async function loadMemberOptions() {
    try {
        const data = await apiCall('/api/members');
        const select = document.getElementById('message-recipients');
        // Keep "all" option
        for (const m of data.members) {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = `${m.first_name} ${m.last_name}`;
            select.appendChild(opt);
        }
        select.setAttribute('multiple', 'true');
        select.size = Math.min(data.members.length + 1, 8);
    } catch (err) {
        // Fallback - just keep "all" option
    }
}

async function sendMessage(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const select = document.getElementById('message-recipients');
    const selectedOptions = Array.from(select.selectedOptions);
    let memberIds;

    if (selectedOptions.some(o => o.value === 'all')) {
        // Get all member IDs
        const data = await apiCall('/api/members');
        memberIds = data.members.map(m => m.id);
    } else {
        memberIds = selectedOptions.map(o => parseInt(o.value));
    }

    try {
        const result = await apiCall('/api/messages/send', {
            method: 'POST',
            body: {
                subject: formData.get('subject'),
                message: formData.get('message'),
                member_ids: memberIds,
                channel: formData.get('channel')
            }
        });

        showToast(`Message sent! ${result.sent} delivered, ${result.failed} failed`);
        closeModal();
        loadMessages();
    } catch (err) {
        // Error shown by apiCall
    }
}

// ==================== SETTINGS ====================

async function saveSettings(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = {};

    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }

    // Handle checkboxes
    data.bible_verse_enabled = form.querySelector('[name="bible_verse_enabled"]')?.checked ? 'true' : 'false';
    data.birthday_enabled = form.querySelector('[name="birthday_enabled"]')?.checked ? 'true' : 'false';
    data.anniversary_enabled = form.querySelector('[name="anniversary_enabled"]')?.checked ? 'true' : 'false';

    try {
        await apiCall('/api/settings', { method: 'PUT', body: data });
        showToast('Settings saved!');
    } catch (err) {
        // Error shown by apiCall
    }
}

async function saveCustomVerseMessage(event) {
    event.preventDefault();
    const message = document.getElementById('custom-verse-message')?.value || '';

    try {
        await apiCall('/api/verse/custom-message', {
            method: 'PUT',
            body: { message }
        });
        showToast('Custom verse message saved!');
    } catch (err) {
        // Error shown by apiCall
    }
}

async function triggerNotifications() {
    if (!confirm('Send all daily notifications now? (Bible verse, birthdays, anniversaries)')) return;

    showToast('Sending notifications...', 'info');
    try {
        await apiCall('/api/scheduler/run-now', { method: 'POST' });
        showToast('Notifications sent successfully!');
    } catch (err) {
        // Error shown by apiCall
    }
}

// ==================== UTILITIES ====================

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatMMDD(mmdd) {
    if (!mmdd) return '—';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const parts = mmdd.split('-');
    if (parts.length !== 2) return mmdd;
    const monthIdx = parseInt(parts[0]) - 1;
    return `${months[monthIdx] || '?'} ${parseInt(parts[1])}`;
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr + 'Z');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch (e) {
        return dateStr;
    }
}

function getMonthOptions(selected) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months.map((name, i) => {
        const val = String(i + 1);
        const sel = (selected && parseInt(selected) === i + 1) ? 'selected' : '';
        return `<option value="${val}" ${sel}>${name}</option>`;
    }).join('');
}

function getDayOptions(selected) {
    let html = '';
    for (let i = 1; i <= 31; i++) {
        const val = String(i);
        const sel = (selected && parseInt(selected) === i) ? 'selected' : '';
        html += `<option value="${val}" ${sel}>${i}</option>`;
    }
    return html;
}

// ==================== REGISTRATION FORM ====================

async function submitRegistration(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = {};

    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }

    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.innerHTML = '<span class="spinner"></span> Registering...';
    btn.disabled = true;

    try {
        const response = await fetch('/members/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.success) {
            form.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-5xl mb-4">🙏</div>
                    <h3 class="text-xl font-display font-bold text-purple-900 mb-2">Welcome to the Family!</h3>
                    <p class="text-gray-600">${result.message}</p>
                </div>
            `;
        } else {
            showToast(result.error || 'Registration failed', 'error');
            btn.textContent = originalText;
            btn.disabled = false;
        }
    } catch (err) {
        showToast('Registration failed. Please try again.', 'error');
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function submitUnsubscribe(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    // Get uuid from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const uuid = urlParams.get('id');

    const data = {
        uuid: uuid || '',
        email: formData.get('email'),
        unsubscribe_email: formData.get('unsubscribe_email') ? 'true' : 'false',
        unsubscribe_sms: formData.get('unsubscribe_sms') ? 'true' : 'false'
    };

    try {
        const response = await fetch('/members/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.success) {
            form.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-4xl mb-4">✅</div>
                    <h3 class="text-xl font-display font-bold text-purple-900 mb-2">Preferences Updated</h3>
                    <p class="text-gray-600">${result.message}</p>
                </div>
            `;
        } else {
            showToast(result.error || 'Failed to update preferences', 'error');
        }
    } catch (err) {
        showToast('Request failed. Please try again.', 'error');
    }
}

// ==================== SEARCH DEBOUNCE ====================

let searchTimeout;
function debounceSearch(query) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadMembers(query), 300);
}

// ==================== PASSWORD CHANGE ====================

async function showChangePasswordModal() {
    // Fetch current admin profile to show email
    let currentEmail = '';
    try {
        const data = await apiCall('/api/admin/profile');
        currentEmail = data.user?.email || '';
    } catch (e) {}

    const content = `
        <form id="password-form" onsubmit="changePassword(event)">
            <div class="mb-4 p-3 bg-blue-50 rounded-lg">
                <label class="block text-sm font-medium text-gray-700 mb-1">📧 Recovery Email <span class="text-xs text-gray-500">(for forgot password)</span></label>
                <div class="flex gap-2">
                    <input type="email" id="admin-email" value="${currentEmail}"
                        class="form-input flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="your-email@example.com">
                    <button type="button" onclick="updateAdminEmail()" class="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Save</button>
                </div>
                <p class="text-xs text-gray-500 mt-1">${currentEmail ? '✅ Email set — forgot password will work' : '⚠️ Set your email so forgot-password reset works'}</p>
            </div>
            <hr class="my-4">
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input type="password" name="current_password" required
                    class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter current password">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" name="new_password" required minlength="6"
                    class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter new password (min 6 characters)">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input type="password" name="confirm_password" required minlength="6"
                    class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Confirm new password">
            </div>
            <div class="flex justify-end gap-3">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                <button type="submit" class="btn-primary px-6 py-2 rounded-lg font-medium">Change Password</button>
            </div>
        </form>
    `;
    showModal('Account Settings', content);
}

async function updateAdminEmail() {
    const email = document.getElementById('admin-email').value.trim();
    if (!email) {
        showToast('Please enter an email address', 'error');
        return;
    }
    try {
        await apiCall('/api/admin/email', {
            method: 'PUT',
            body: { email }
        });
        showToast('Recovery email updated!');
    } catch (err) {
        // Error already shown by apiCall
    }
}

async function changePassword(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const currentPassword = formData.get('current_password');
    const newPassword = formData.get('new_password');
    const confirmPassword = formData.get('confirm_password');

    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }

    try {
        await apiCall('/api/admin/password', {
            method: 'PUT',
            body: { current_password: currentPassword, new_password: newPassword }
        });
        showToast('Password changed successfully!');
        closeModal();
    } catch (err) {
        // Error already shown by apiCall
    }
}

// ==================== LESSON MANAGEMENT ====================

async function loadLessons(searchQuery) {
    const container = document.getElementById('lessons-table-body');
    if (!container) return;

    const search = searchQuery !== undefined ? searchQuery : (document.getElementById('lesson-search')?.value || '');
    const status = document.getElementById('lesson-status-filter')?.value || '';

    try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (status) params.set('status', status);

        const data = await apiCall(`/api/lessons?${params.toString()}`);
        renderLessonsTable(data.lessons);
    } catch (err) {
        container.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">Failed to load lessons</td></tr>';
    }
}

function renderLessonsTable(lessons) {
    const container = document.getElementById('lessons-table-body');
    if (!container) return;

    const countEl = document.getElementById('lesson-count');
    if (countEl) countEl.textContent = lessons.length;

    if (lessons.length === 0) {
        container.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">No lessons found. Click "Add Lesson" to create one.</td></tr>';
        return;
    }

    container.innerHTML = lessons.map(l => `
        <tr class="border-b border-gray-100">
            <td class="px-4 py-3">
                <div class="font-medium text-gray-900">${escapeHtml(l.title)}</div>
                ${l.description ? `<div class="text-xs text-gray-500 mt-1">${escapeHtml(l.description).substring(0, 60)}${l.description.length > 60 ? '...' : ''}</div>` : ''}
            </td>
            <td class="px-4 py-3 text-gray-600">${escapeHtml(l.scripture_reference || '—')}</td>
            <td class="px-4 py-3 text-gray-600">${l.study_date ? formatDate(l.study_date) : '—'}</td>
            <td class="px-4 py-3">
                <span class="badge ${l.status === 'published' ? 'badge-success' : 'badge-warning'}">
                    ${l.status === 'published' ? 'Published' : 'Draft'}
                </span>
            </td>
            <td class="px-4 py-3 text-gray-600">${l.attachment_count || 0} file${l.attachment_count !== 1 ? 's' : ''}</td>
            <td class="px-4 py-3">
                <div class="flex gap-2">
                    <button onclick="editLesson(${l.id})" class="text-purple-700 hover:text-purple-900 text-sm font-medium">Edit</button>
                    <button onclick="deleteLesson(${l.id}, '${escapeHtml(l.title).replace(/'/g, "\\'")}')"
                        class="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function showAddLessonModal() {
    const content = getLessonFormHTML();
    showModal('Add Bible Study Lesson', content);
}

async function editLesson(id) {
    try {
        const data = await apiCall(`/api/lessons/${id}`);
        const content = getLessonFormHTML(data.lesson, data.attachments);
        showModal('Edit Lesson', content);
    } catch (err) {
        showToast('Failed to load lesson details', 'error');
    }
}

function getLessonFormHTML(lesson = null, attachments = []) {
    const l = lesson || {};

    let attachmentHTML = '';
    if (lesson && attachments.length > 0) {
        attachmentHTML = `
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Current Attachments</label>
                <div class="space-y-2" id="current-attachments">
                    ${attachments.map(att => `
                        <div class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2" id="att-${att.id}">
                            <div class="flex items-center gap-2">
                                <span class="text-gray-500">${getFileIcon(att.mime_type)}</span>
                                <span class="text-sm text-gray-700">${escapeHtml(att.original_name)}</span>
                                <span class="text-xs text-gray-400">(${formatFileSize(att.file_size)})</span>
                            </div>
                            <div class="flex gap-2">
                                <a href="/api/lessons/${l.id}/attachments/${att.id}/download"
                                    class="text-purple-600 hover:text-purple-800 text-xs font-medium">Download</a>
                                <label class="text-blue-600 hover:text-blue-800 text-xs font-medium cursor-pointer">
                                    Replace
                                    <input type="file" class="hidden" onchange="replaceAttachment(${l.id}, ${att.id}, this)">
                                </label>
                                <button onclick="deleteAttachment(${l.id}, ${att.id})"
                                    class="text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    return `
        <form id="lesson-form" onsubmit="saveLesson(event, ${l.id || 'null'})">
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" name="title" value="${escapeHtml(l.title || '')}" required
                    class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Faith and Works - James Chapter 2">
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Scripture Reference</label>
                    <input type="text" name="scripture_reference" value="${escapeHtml(l.scripture_reference || '')}"
                        class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="e.g., James 2:14-26">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Study Date</label>
                    <input type="date" name="study_date" value="${l.study_date || ''}"
                        class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg">
                </div>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" name="description" value="${escapeHtml(l.description || '')}"
                    class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Brief summary of the lesson">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Lesson Content</label>
                <textarea name="content" rows="6"
                    class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Full lesson notes, discussion questions, key points...">${escapeHtml(l.content || '')}</textarea>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="draft" ${l.status === 'draft' || !l.status ? 'selected' : ''}>Draft</option>
                    <option value="published" ${l.status === 'published' ? 'selected' : ''}>Published</option>
                </select>
            </div>
            ${attachmentHTML}
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    ${lesson ? 'Add More Attachments' : 'Attachments'}
                </label>
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input type="file" name="files" multiple id="lesson-files"
                        class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100">
                    <p class="text-xs text-gray-400 mt-2">Any file type, max 10MB each</p>
                </div>
            </div>
            <div class="flex justify-end gap-3">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                <button type="submit" class="btn-primary px-6 py-2 rounded-lg font-medium">${lesson ? 'Save Changes' : 'Create Lesson'}</button>
            </div>
        </form>
    `;
}

async function saveLesson(event, id) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const lessonData = {
        title: formData.get('title'),
        description: formData.get('description'),
        scripture_reference: formData.get('scripture_reference'),
        content: formData.get('content'),
        study_date: formData.get('study_date'),
        status: formData.get('status')
    };

    try {
        let lessonId = id;

        if (id) {
            await apiCall(`/api/lessons/${id}`, { method: 'PUT', body: lessonData });
        } else {
            const result = await apiCall('/api/lessons', { method: 'POST', body: lessonData });
            lessonId = result.id;
        }

        // Upload attachments if any
        const fileInput = document.getElementById('lesson-files');
        if (fileInput && fileInput.files.length > 0) {
            const uploadData = new FormData();
            for (const file of fileInput.files) {
                uploadData.append('files', file);
            }
            await fetch(`/api/lessons/${lessonId}/attachments`, {
                method: 'POST',
                body: uploadData,
                credentials: 'same-origin'
            });
        }

        showToast(id ? 'Lesson updated!' : 'Lesson created!');
        closeModal();
        loadLessons();
    } catch (err) {
        // Error shown by apiCall
    }
}

async function deleteLesson(id, title) {
    if (!confirm(`Are you sure you want to delete "${title}"? This will also remove all attachments.`)) return;

    try {
        await apiCall(`/api/lessons/${id}`, { method: 'DELETE' });
        showToast('Lesson deleted');
        loadLessons();
    } catch (err) {
        // Error shown by apiCall
    }
}

async function replaceAttachment(lessonId, attachmentId, input) {
    if (!input.files || input.files.length === 0) return;

    const uploadData = new FormData();
    uploadData.append('file', input.files[0]);

    try {
        const response = await fetch(`/api/lessons/${lessonId}/attachments/${attachmentId}`, {
            method: 'PUT',
            body: uploadData,
            credentials: 'same-origin'
        });
        const data = await response.json();

        if (data.success) {
            showToast('Attachment replaced!');
            // Refresh the edit modal
            editLesson(lessonId);
        } else {
            showToast(data.error || 'Failed to replace', 'error');
        }
    } catch (err) {
        showToast('Failed to replace attachment', 'error');
    }
}

async function deleteAttachment(lessonId, attachmentId) {
    if (!confirm('Remove this attachment?')) return;

    try {
        await apiCall(`/api/lessons/${lessonId}/attachments/${attachmentId}`, { method: 'DELETE' });
        // Remove the element from DOM
        const el = document.getElementById(`att-${attachmentId}`);
        if (el) el.remove();
        showToast('Attachment removed');
    } catch (err) {
        // Error shown by apiCall
    }
}

function getFileIcon(mimeType) {
    if (!mimeType) return '📄';
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.startsWith('video/')) return '🎬';
    return '📄';
}

function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

let lessonSearchTimeout;
function debounceLessonSearch(query) {
    clearTimeout(lessonSearchTimeout);
    lessonSearchTimeout = setTimeout(() => loadLessons(query), 300);
}
