// ==========================================
// 1% STUDENT - INTERACTIVE APP ENGINE
// ==========================================


document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initHabits();
    initPomodoro();
    initNotes();
    initPlatforms();
    initNav();
    initAuth();
});

// ------------------------------------------
// 1. THEME SWITCHER
// ------------------------------------------
function initTheme() {
    const themeBtn = document.getElementById('themeToggle');
    if (!themeBtn) return;

    const savedTheme = localStorage.getItem('1percent_theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeBtn.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('1percent_theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

// ------------------------------------------
// 2. DAILY HABITS & 1% STREAK TRACKER
// ------------------------------------------
const DEFAULT_HABITS = [
    { id: 1, text: 'Solve 1 LeetCode / DSA Problem', category: 'Coding', done: false },
    { id: 2, text: 'Make 1 Git Commit / Project Update', category: 'Project', done: false },
    { id: 3, text: 'Read 1 Tech Article or Documentation', category: 'Learning', done: false },
    { id: 4, text: 'Complete 1 Pomodoro Focus Session', category: 'Focus', done: false }
];

function initHabits() {
    loadHabitData();
    renderHabits();
    updateHabitStats();

    const addBtn = document.getElementById('addHabitBtn');
    const input = document.getElementById('newHabitInput');

    if (addBtn && input) {
        addBtn.addEventListener('click', () => {
            const text = input.value.trim();
            if (text) {
                addNewHabit(text);
                input.value = '';
            }
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const text = input.value.trim();
                if (text) {
                    addNewHabit(text);
                    input.value = '';
                }
            }
        });
    }

    const resetBtn = document.getElementById('resetHabitsBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Reset today\'s checklist progress?')) {
                resetTodayHabits();
            }
        });
    }
}

function getHabitState() {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem('1percent_habits_data');
    if (!saved) {
        return { lastDate: today, streak: 1, habits: [...DEFAULT_HABITS] };
    }

    try {
        const data = JSON.parse(saved);
        if (data.lastDate !== today) {
            // Check if streak is broken (more than 1 day missed)
            const last = new Date(data.lastDate);
            const curr = new Date(today);
            const diffDays = Math.floor((curr - last) / (1000 * 60 * 60 * 24));

            let newStreak = data.streak;
            const completedCount = (data.habits || []).filter(h => h.done).length;

            if (diffDays === 1) {
                if (completedCount >= 2) {
                    newStreak += 1;
                } else {
                    newStreak = 1; // Streak reset if less than 2 completed yesterday
                }
            } else if (diffDays > 1) {
                newStreak = 1;
            }

            // Reset done states for new day, keep habits list
            const resetHabits = (data.habits || DEFAULT_HABITS).map(h => ({ ...h, done: false }));
            const newData = { lastDate: today, streak: newStreak, habits: resetHabits };
            localStorage.setItem('1percent_habits_data', JSON.stringify(newData));
            return newData;
        }
        return data;
    } catch (e) {
        return { lastDate: today, streak: 1, habits: [...DEFAULT_HABITS] };
    }
}

function saveHabitData(data) {
    localStorage.setItem('1percent_habits_data', JSON.stringify(data));
}

function loadHabitData() {
    window.habitState = getHabitState();
}

function renderHabits() {
    const list = document.getElementById('habitList');
    if (!list) return;

    list.innerHTML = '';
    window.habitState.habits.forEach(habit => {
        const item = document.createElement('div');
        item.className = `habit-item ${habit.done ? 'completed' : ''}`;
        item.innerHTML = `
            <label class="checkbox-container">
                <input type="checkbox" ${habit.done ? 'checked' : ''} onchange="toggleHabit(${habit.id})">
                <span class="checkmark"></span>
                <span class="habit-text">${escapeHtml(habit.text)}</span>
            </label>
            <button class="delete-habit-btn" onclick="deleteHabit(${habit.id})" title="Delete task">&times;</button>
        `;
        list.appendChild(item);
    });
}

window.toggleHabit = function (id) {
    const habit = window.habitState.habits.find(h => h.id === id);
    if (habit) {
        habit.done = !habit.done;
        saveHabitData(window.habitState);
        renderHabits();
        updateHabitStats();
    }
};

window.deleteHabit = function (id) {
    window.habitState.habits = window.habitState.habits.filter(h => h.id !== id);
    saveHabitData(window.habitState);
    renderHabits();
    updateHabitStats();
};

function addNewHabit(text) {
    const newId = Date.now();
    window.habitState.habits.push({ id: newId, text, category: 'Custom', done: false });
    saveHabitData(window.habitState);
    renderHabits();
    updateHabitStats();
}

function resetTodayHabits() {
    window.habitState.habits.forEach(h => h.done = false);
    saveHabitData(window.habitState);
    renderHabits();
    updateHabitStats();
}

function updateHabitStats() {
    const habits = window.habitState.habits;
    const total = habits.length;
    const completed = habits.filter(h => h.done).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Update streak display
    const streakEl = document.getElementById('streakCount');
    if (streakEl) streakEl.textContent = window.habitState.streak;

    // Update ratio text
    const ratioEl = document.getElementById('habitRatio');
    if (ratioEl) ratioEl.textContent = `${completed}/${total}`;

    // Update progress ring
    const circle = document.getElementById('progressCircle');
    const pctText = document.getElementById('progressPercent');
    if (pctText) pctText.textContent = `${percentage}%`;

    if (circle) {
        const radius = circle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        const offset = circumference - (percentage / 100) * circumference;
        circle.style.strokeDashoffset = offset;
    }
}

// ------------------------------------------
// 3. POMODORO FOCUS TIMER
// ------------------------------------------
let timerInterval = null;
let timerSecondsLeft = 25 * 60;
let timerTotalSeconds = 25 * 60;
let isTimerRunning = false;
let currentTimerMode = 'work'; // 'work', 'shortBreak', 'longBreak'

const TIMER_MODES = {
    work: { name: 'Deep Work', minutes: 25 },
    shortBreak: { name: 'Short Break', minutes: 5 },
    longBreak: { name: 'Long Break', minutes: 15 }
};

function initPomodoro() {
    const startBtn = document.getElementById('timerStartBtn');
    const pauseBtn = document.getElementById('timerPauseBtn');
    const resetBtn = document.getElementById('timerResetBtn');
    const modeBtns = document.querySelectorAll('.timer-mode-btn');

    if (startBtn) startBtn.addEventListener('click', startTimer);
    if (pauseBtn) pauseBtn.addEventListener('click', pauseTimer);
    if (resetBtn) resetBtn.addEventListener('click', resetTimer);

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setTimerMode(btn.dataset.mode);
        });
    });

    updateTimerDisplay();
}

function setTimerMode(mode) {
    pauseTimer();
    currentTimerMode = mode;
    const mins = TIMER_MODES[mode].minutes;
    timerSecondsLeft = mins * 60;
    timerTotalSeconds = mins * 60;
    updateTimerDisplay();
}

function startTimer() {
    if (isTimerRunning) return;
    isTimerRunning = true;

    document.getElementById('timerStartBtn')?.classList.add('hidden');
    document.getElementById('timerPauseBtn')?.classList.remove('hidden');

    timerInterval = setInterval(() => {
        if (timerSecondsLeft > 0) {
            timerSecondsLeft--;
            updateTimerDisplay();
        } else {
            pauseTimer();
            playTimerSound();
            alert(`🎉 Time's up! Session finished: ${TIMER_MODES[currentTimerMode].name}`);

            // Increment completed focus sessions if in work mode
            if (currentTimerMode === 'work') {
                autoCheckFocusHabit();
            }
        }
    }, 1000);
}

function pauseTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
    document.getElementById('timerStartBtn')?.classList.remove('hidden');
    document.getElementById('timerPauseBtn')?.classList.add('hidden');
}

function resetTimer() {
    pauseTimer();
    const mins = TIMER_MODES[currentTimerMode].minutes;
    timerSecondsLeft = mins * 60;
    timerTotalSeconds = mins * 60;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const mins = Math.floor(timerSecondsLeft / 60);
    const secs = timerSecondsLeft % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const displayEl = document.getElementById('timerDisplay');
    if (displayEl) displayEl.textContent = formatted;

    const ring = document.getElementById('timerRingCircle');
    if (ring) {
        const radius = ring.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        ring.style.strokeDasharray = `${circumference} ${circumference}`;
        const pct = timerSecondsLeft / timerTotalSeconds;
        const offset = circumference - (pct * circumference);
        ring.style.strokeDashoffset = offset;
    }
}

function playTimerSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
        console.log('Audio cue unavailable');
    }
}

function autoCheckFocusHabit() {
    const habit = window.habitState?.habits?.find(h => h.text.includes('Pomodoro Focus Session'));
    if (habit && !habit.done) {
        habit.done = true;
        saveHabitData(window.habitState);
        renderHabits();
        updateHabitStats();
    }
}

// ------------------------------------------
// 4. QUICK NOTES & SNIPPET MANAGER
// ------------------------------------------
let notesList = [];

function initNotes() {
    loadNotes();
    renderNotes();

    const saveBtn = document.getElementById('saveNoteBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveCurrentNote);
    }

    const searchInput = document.getElementById('noteSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderNotes(e.target.value.toLowerCase());
        });
    }
}

function loadNotes() {
    const saved = localStorage.getItem('1percent_notes');
    if (saved) {
        try {
            notesList = JSON.parse(saved);
        } catch (e) {
            notesList = getDefaultNotes();
        }
    } else {
        notesList = getDefaultNotes();
        saveNotesToStorage();
    }
}

function getDefaultNotes() {
    return [
        {
            id: 1,
            title: 'Binary Search Template',
            tag: 'DSA',
            code: 'let left = 0, right = nums.length - 1;\nwhile (left <= right) {\n  let mid = Math.floor((left + right) / 2);\n  if (nums[mid] === target) return mid;\n  if (nums[mid] < target) left = mid + 1;\n  else right = mid - 1;\n}\nreturn -1;',
            date: new Date().toLocaleDateString()
        },
        {
            id: 2,
            title: 'Git Quick Undo Commit',
            tag: 'Git',
            code: 'git reset --soft HEAD~1',
            date: new Date().toLocaleDateString()
        }
    ];
}

function saveNotesToStorage() {
    localStorage.setItem('1percent_notes', JSON.stringify(notesList));
}

function saveCurrentNote() {
    const titleInput = document.getElementById('noteTitle');
    const tagInput = document.getElementById('noteTag');
    const contentInput = document.getElementById('noteContent');

    const title = titleInput.value.trim();
    const tag = tagInput.value.trim() || 'General';
    const code = contentInput.value.trim();

    if (!title || !code) {
        alert('Please fill in both a Title and Snippet/Note content!');
        return;
    }

    const newNote = {
        id: Date.now(),
        title,
        tag,
        code,
        date: new Date().toLocaleDateString()
    };
    notesList.unshift(newNote);
    saveNotesToStorage();

    renderNotes();
    titleInput.value = '';
    tagInput.value = '';
    contentInput.value = '';
}

function renderNotes(query = '') {
    const container = document.getElementById('notesContainer');
    if (!container) return;

    container.innerHTML = '';
    const filtered = notesList.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.tag.toLowerCase().includes(query) ||
        n.code.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
        container.innerHTML = `<p class="empty-state">No notes found. Create your first code snippet!</p>`;
        return;
    }

    filtered.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.innerHTML = `
            <div class="note-header">
                <div>
                    <span class="note-tag">${escapeHtml(note.tag)}</span>
                    <h3 class="note-title">${escapeHtml(note.title)}</h3>
                </div>
                <button class="delete-note-btn" onclick="deleteNote(${note.id})" title="Delete Note">&times;</button>
            </div>
            <pre class="note-code"><code>${escapeHtml(note.code)}</code></pre>
            <div class="note-footer">
                <span class="note-date">${note.date}</span>
                <button class="copy-btn" onclick="copySnippet(this, ${note.id})">📋 Copy</button>
            </div>
        `;
        container.appendChild(card);
    });
}

window.deleteNote = function (id) {
    notesList = notesList.filter(n => n.id !== id);
    saveNotesToStorage();
    renderNotes();
};

window.copySnippet = function (btn, id) {
    const note = notesList.find(n => n.id === id);
    if (note) {
        navigator.clipboard.writeText(note.code).then(() => {
            const originalText = btn.textContent;
            btn.textContent = '✅ Copied!';
            btn.classList.add('copied');
            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('copied');
            }, 2000);
        });
    }
};

// ------------------------------------------
// 5. CODING PLATFORMS HUB & CUSTOM BOOKMARKS
// ------------------------------------------
const DEFAULT_PLATFORMS = [
    {
        id: 'github',
        name: 'GitHub',
        category: 'portfolio',
        desc: 'Build, host & share code repositories',
        url: 'https://github.com',
        icon: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
        quickLinkText: 'Trending Repos',
        quickLinkUrl: 'https://github.com/trending'
    },
    {
        id: 'leetcode',
        name: 'LeetCode',
        category: 'dsa',
        desc: 'Practice coding & algorithm problems',
        url: 'https://leetcode.com',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/1/19/LeetCode_logo_black.png',
        quickLinkText: 'Problemset',
        quickLinkUrl: 'https://leetcode.com/problemset/all/'
    },
    {
        id: 'codeforces',
        name: 'Codeforces',
        category: 'cp',
        desc: 'Competitive programming & timed contests',
        url: 'https://codeforces.com',
        icon: 'https://sta.codeforces.com/s/0/favicon-32x32.png',
        quickLinkText: 'Upcoming Contests',
        quickLinkUrl: 'https://codeforces.com/contests'
    },
    {
        id: 'codechef',
        name: 'CodeChef',
        category: 'cp',
        desc: 'Competitive coding contests & practice',
        url: 'https://codechef.com',
        icon: 'https://cdn.codechef.com/images/cc-logo.svg',
        quickLinkText: 'Compete',
        quickLinkUrl: 'https://www.codechef.com/contests'
    },
    {
        id: 'hackerrank',
        name: 'HackerRank',
        category: 'dsa',
        desc: 'Practice domain skills & certifications',
        url: 'https://hackerrank.com',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/6/65/HackerRank_logo.png',
        quickLinkText: 'Prepare DSA',
        quickLinkUrl: 'https://www.hackerrank.com/domains/dsa'
    },
    {
        id: 'gfg',
        name: 'GeeksforGeeks',
        category: 'docs',
        desc: 'Computer science articles & problem sets',
        url: 'https://geeksforgeeks.org',
        icon: 'https://media.geeksforgeeks.org/gfg-gg-logo.svg',
        quickLinkText: 'Problem of the Day',
        quickLinkUrl: 'https://practice.geeksforgeeks.org/problem-of-the-day'
    },
    {
        id: 'linkedin',
        name: 'LinkedIn',
        category: 'portfolio',
        desc: 'Connect with developers & tech recruiters',
        url: 'https://linkedin.com',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png',
        quickLinkText: 'Jobs Feed',
        quickLinkUrl: 'https://www.linkedin.com/jobs'
    },
    {
        id: 'mdn',
        name: 'MDN Web Docs',
        category: 'docs',
        desc: 'Authoritative documentation for HTML, CSS, JS',
        url: 'https://developer.mozilla.org',
        icon: 'https://developer.mozilla.org/favicon-48x48.png',
        quickLinkText: 'JS Reference',
        quickLinkUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript'
    }
];

let customBookmarks = [];

function initPlatforms() {
    loadCustomBookmarks();
    renderPlatforms();

    // Search bar event
    const searchInput = document.getElementById('searchBox');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterPlatforms();
        });
    }

    // Category pill filters
    const filterBtns = document.querySelectorAll('.cat-pill');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterPlatforms();
        });
    });

    // Custom link modal logic
    const addBookmarkBtn = document.getElementById('addBookmarkBtn');
    const modal = document.getElementById('bookmarkModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const saveBookmarkBtn = document.getElementById('saveBookmarkBtn');

    if (addBookmarkBtn && modal) {
        addBookmarkBtn.addEventListener('click', () => modal.classList.add('open'));
    }
    if (closeModalBtn && modal) {
        closeModalBtn.addEventListener('click', () => modal.classList.remove('open'));
    }
    if (saveBookmarkBtn) {
        saveBookmarkBtn.addEventListener('click', addCustomBookmark);
    }
}

function loadCustomBookmarks() {
    const saved = localStorage.getItem('1percent_custom_bookmarks');
    if (saved) {
        try {
            customBookmarks = JSON.parse(saved);
        } catch (e) {
            customBookmarks = [];
        }
    }
}

function saveCustomBookmarks() {
    localStorage.setItem('1percent_custom_bookmarks', JSON.stringify(customBookmarks));
}

function addCustomBookmark() {
    const nameInput = document.getElementById('bmName');
    const urlInput = document.getElementById('bmUrl');
    const catSelect = document.getElementById('bmCategory');

    const name = nameInput.value.trim();
    let url = urlInput.value.trim();
    const category = catSelect.value;

    if (!name || !url) {
        alert('Please provide a platform name and valid URL!');
        return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    const newBm = {
        id: 'custom_' + Date.now(),
        name,
        category,
        desc: 'Custom Bookmark',
        url,
        icon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=64`,
        isCustom: true
    };

    customBookmarks.push(newBm);
    saveCustomBookmarks();
    renderPlatforms();

    nameInput.value = '';
    urlInput.value = '';
    document.getElementById('bookmarkModal')?.classList.remove('open');
}

function filterPlatforms() {
    const query = document.getElementById('searchBox')?.value.toLowerCase() || '';
    const activeCat = document.querySelector('.cat-pill.active')?.dataset.category || 'all';

    const cards = document.querySelectorAll('.platform-card');
    cards.forEach(card => {
        const name = card.dataset.name.toLowerCase();
        const desc = card.dataset.desc.toLowerCase();
        const category = card.dataset.category;

        const matchesSearch = name.includes(query) || desc.includes(query);
        const matchesCategory = activeCat === 'all' || category === activeCat;

        if (matchesSearch && matchesCategory) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

function renderPlatforms() {
    const container = document.getElementById('platformGrid');
    if (!container) return;

    container.innerHTML = '';

    const allPlatforms = [...DEFAULT_PLATFORMS, ...customBookmarks];
    let connections = {};
    try {
        const connectionsStr = localStorage.getItem('1percent_platform_connections');
        if (connectionsStr) connections = JSON.parse(connectionsStr);
    } catch (e) {
        console.error("Error parsing connections", e);
    }

    allPlatforms.forEach(p => {
        const conn = connections[p.id];
        const isConnected = !!conn;
        const profileUrl = conn ? conn.url : p.url;

        const card = document.createElement('div');
        card.className = 'platform-card';
        card.dataset.name = p.name;
        card.dataset.desc = p.desc;
        card.dataset.category = p.category;

        card.innerHTML = `
            <div class="platform-header">
                <img src="${p.icon}" alt="${escapeHtml(p.name)}" class="platform-icon" onerror="this.src='https://cdn-icons-png.flaticon.com/512/1006/1006771.png'">
                ${p.isCustom ? `<button class="delete-bm-btn" onclick="deleteCustomBookmark('${p.id}')" title="Delete bookmark">&times;</button>` : ''}
            </div>
            <h3 class="platform-title">${escapeHtml(p.name)}</h3>
            <p class="platform-desc">${escapeHtml(p.desc)}</p>
            
            <div style="margin-bottom: 12px; font-size: 13px;">
                ${isConnected ? 
                    `<div style="color: var(--accent-green); font-weight: 600; margin-bottom: 4px;">✓ Connected as <span style="color: var(--text-main); font-weight:500;">${escapeHtml(conn.username)}</span></div>` : 
                    `<div style="color: var(--text-muted); font-weight: 600; margin-bottom: 4px;">Not Connected</div>`
                }
            </div>
            
            <div class="platform-actions">
                <a href="${profileUrl}" target="_blank" class="platform-link-btn">Visit Profile ↗</a>
                <button class="quick-link-btn" onclick="openConnectModal('${p.id}', '${escapeHtml(p.name)}')">
                    ${isConnected ? 'Edit' : 'Connect'}
                </button>
            </div>
        `;
        container.appendChild(card);
    });

    filterPlatforms();
}

window.openConnectModal = function(id, name) {
    const modal = document.getElementById('connectPlatformModal');
    if (!modal) return;
    
    const currentUserStr = localStorage.getItem('1percent_current_user');
    if (!currentUserStr) {
        alert("Please login to save your coding profiles!");
        document.getElementById('loginBtn').click();
        return;
    }

    const title = document.getElementById('connectPlatformTitle');
    const idInput = document.getElementById('connectPlatformId');
    const userInput = document.getElementById('connectUsername');
    const urlInput = document.getElementById('connectUrl');

    title.textContent = `Connect ${name}`;
    idInput.value = id;

    let connections = {};
    try {
        const connectionsStr = localStorage.getItem('1percent_platform_connections');
        if (connectionsStr) connections = JSON.parse(connectionsStr);
    } catch (e) {}
    const conn = connections[id];

    userInput.value = conn ? conn.username : '';
    urlInput.value = conn ? conn.url : '';

    modal.classList.add('open');
};

document.addEventListener('DOMContentLoaded', () => {
    const saveConnectBtn = document.getElementById('saveConnectBtn');
    if (saveConnectBtn) {
        saveConnectBtn.addEventListener('click', () => {
            const id = document.getElementById('connectPlatformId').value;
            const username = document.getElementById('connectUsername').value.trim();
            let url = document.getElementById('connectUrl').value.trim();

            if (!username || !url) {
                alert('Please provide both username and profile URL.');
                return;
            }

            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }

            let connections = {};
            try {
                const connectionsStr = localStorage.getItem('1percent_platform_connections');
                if (connectionsStr) connections = JSON.parse(connectionsStr);
            } catch (e) {}

            connections[id] = { username, url };
            
            // Save local first for fast feedback
            localStorage.setItem('1percent_platform_connections', JSON.stringify(connections));

            document.getElementById('connectPlatformModal').classList.remove('open');
            renderPlatforms();
        });
    }
});

window.deleteCustomBookmark = function (id) {
    customBookmarks = customBookmarks.filter(b => b.id !== id);
    saveCustomBookmarks();
    renderPlatforms();
};

// ------------------------------------------
// 6. NAVIGATION & HELPER UTILS
// ------------------------------------------
function initNav() {
    document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function (m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}

// ------------------------------------------
// 7. AUTHENTICATION & LOGIN LOGIC
// ------------------------------------------
let authMode = 'signup'; // 'login' or 'signup'

function initAuth() {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const authModal = document.getElementById('authModal');
    const closeAuthBtn = document.getElementById('closeAuthModalBtn');
    const toggleLink = document.getElementById('authToggleLink');
    
    checkLoginState();

    if (loginBtn && authModal) {
        loginBtn.addEventListener('click', () => {
            setAuthMode('login');
            authModal.classList.add('open');
        });
    }

    if (signupBtn && authModal) {
        signupBtn.addEventListener('click', () => {
            setAuthMode('signup');
            authModal.classList.add('open');
        });
    }
    
    if (toggleLink) {
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            setAuthMode(authMode === 'login' ? 'signup' : 'login');
        });
    }

    if (closeAuthBtn && authModal) {
        closeAuthBtn.addEventListener('click', () => authModal.classList.remove('open'));
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('1percent_current_user');
            checkLoginState();
            // Reset habit data on logout
            window.habitState = { lastDate: new Date().toISOString().split('T')[0], streak: 1, habits: [...DEFAULT_HABITS] };
            saveHabitData(window.habitState);
            renderHabits();
            updateHabitStats();
        });
    }

    const togglePwdBtns = document.querySelectorAll('.toggle-password-btn');
    togglePwdBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input) {
                if (input.type === 'password') {
                    input.type = 'text';
                    btn.textContent = '🙈';
                } else {
                    input.type = 'password';
                    btn.textContent = '👁️';
                }
            }
        });
    });
}

function setAuthMode(mode) {
    authMode = mode;
    const title = document.getElementById('authModalTitle');
    const fullNameGroup = document.getElementById('fullNameGroup');
    const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
    const forgotPasswordGroup = document.getElementById('forgotPasswordGroup');
    const submitBtn = document.getElementById('authSubmitBtn');
    const toggleText = document.getElementById('authToggleText');
    const toggleLink = document.getElementById('authToggleLink');
    const fullNameInput = document.getElementById('authFullName');
    const confirmPwdInput = document.getElementById('authConfirmPassword');

    if (mode === 'login') {
        if(title) title.textContent = 'Login';
        if(fullNameGroup) fullNameGroup.style.display = 'none';
        if(confirmPasswordGroup) confirmPasswordGroup.style.display = 'none';
        if(forgotPasswordGroup) forgotPasswordGroup.style.display = 'block';
        if(submitBtn) submitBtn.textContent = 'Login';
        if(toggleText) toggleText.textContent = "Don't have an account?";
        if(toggleLink) toggleLink.textContent = "Sign Up";
        
        fullNameInput.removeAttribute('required');
        confirmPwdInput.removeAttribute('required');
    } else {
        if(title) title.textContent = 'Sign Up';
        if(fullNameGroup) fullNameGroup.style.display = 'block';
        if(confirmPasswordGroup) confirmPasswordGroup.style.display = 'block';
        if(forgotPasswordGroup) forgotPasswordGroup.style.display = 'none';
        if(submitBtn) submitBtn.textContent = 'Create Account';
        if(toggleText) toggleText.textContent = "Already have an account?";
        if(toggleLink) toggleLink.textContent = "Login";
        
        fullNameInput.setAttribute('required', 'true');
        confirmPwdInput.setAttribute('required', 'true');
    }
}

window.submitAuth = function() {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    
    if (authMode === 'signup') {
        const fullName = document.getElementById('authFullName').value.trim();
        const confirmPassword = document.getElementById('authConfirmPassword').value;
        
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        
        // Mock save user
        const user = { name: fullName, email: email };
        localStorage.setItem('1percent_current_user', JSON.stringify(user));
        alert("Account created successfully!");
    } else {
        // Mock login check
        if(email === '' || password === '') return;
        const user = { name: email.split('@')[0], email: email };
        localStorage.setItem('1percent_current_user', JSON.stringify(user));
    }
    
    document.getElementById('authModal').classList.remove('open');
    document.getElementById('authForm').reset();
    checkLoginState();
}

function checkLoginState() {
    const authButtons = document.getElementById('authButtons');
    const userProfile = document.getElementById('userProfile');
    const welcomeText = document.getElementById('welcomeText');
    
    const currentUserStr = localStorage.getItem('1percent_current_user');
    
    if (currentUserStr) {
        const user = JSON.parse(currentUserStr);
        if(authButtons) authButtons.style.display = 'none';
        if(userProfile) userProfile.style.display = 'flex';
        if(welcomeText) welcomeText.textContent = `Welcome, ${escapeHtml(user.name)}`;
    } else {
        if(authButtons) authButtons.style.display = 'flex';
        if(userProfile) userProfile.style.display = 'none';
    }
}
