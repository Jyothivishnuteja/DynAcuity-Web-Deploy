async function fetchProgressData() {
    const token = localStorage.getItem('dynacuity_token');
    if (!token) {
        window.location.href = 'auth/login.html';
        return;
    }

    try {
        // Parallel fetch for results and user details
        const [resultsRes, userRes] = await Promise.all([
            fetch(`${BASE_URL}/results/`, {
                headers: {
                    'Authorization': `Token ${token}`
                }
            }),
            fetch(`${BASE_URL}/auth/user/`, {
                headers: {
                    'Authorization': `Token ${token}`
                }
            })
        ]);

        if (resultsRes.ok && userRes.ok) {
            const results = await resultsRes.json();
            const user = await userRes.json();

            // Inject Name
            if (user && user.full_name) {
                const nameSpan = document.getElementById('userName');
                if (nameSpan) nameSpan.innerText = user.full_name + "'s";
            }

            updateProgressUI(results, user);
            if (typeof renderResultsTable === 'function') {
                renderResultsTable(results, 'historyTableContainer', 30); // Show last 30 in progress
            }
        } else {
            console.error('Failed to fetch progress data:', resultsRes.status, userRes.status);
            alert(`Failed to load progress data from server. (Results Status: ${resultsRes.status}, User Status: ${userRes.status})`);
        }
    } catch (error) {
        console.error('Error fetching progress:', error);
        alert(`Failed to load progress data due to network error: ${error.message}`);
    }
}

function updateProgressUI(results, user) {
    const statAcc = document.getElementById('stat-accuracy-progress');
    const statLevel = document.getElementById('stat-level-progress');
    const statStreak = document.getElementById('stat-streak-progress');
    const statSessions = document.getElementById('stat-sessions-progress');
    const bars = document.querySelectorAll('.bar');

    // Update Stats from User object (for consistency with Dashboard)
    if (user) {
        if (statAcc) statAcc.innerText = Math.round(user.accuracy || 0) + '%';
        if (statLevel) statLevel.innerText = user.level || '--';
        if (statStreak) statStreak.innerText = user.streak || 0;
    }

    if (results) {
        if (statSessions) statSessions.innerText = results.length;
    }

    // Weekly Chart Logic - ONLY CURRENT WEEK XP
    const dayXP = [0, 0, 0, 0, 0, 0, 0]; // M T W T F S S

    // Get start of current week (Monday)
    const now = new Date();
    const currentDayIndex = (now.getDay() + 6) % 7; // 0=Mon, 6=Sun
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDayIndex);
    startOfWeek.setHours(0, 0, 0, 0);

    results.forEach(r => {
        let dateStr = r.created_at || r.timestamp;
        if (dateStr && typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+')) {
            dateStr += 'Z';
        }
        const date = new Date(dateStr);
        if (date >= startOfWeek) {
            const day = (date.getDay() + 6) % 7;
            dayXP[day] += (r.score || 0);
        }
    });

    const maxXP = Math.max(...dayXP, 1000); // Scale relative to at least 1000 XP for visible growth
    bars.forEach((bar, i) => {
        const height = (dayXP[i] / maxXP) * 100;
        bar.style.height = Math.max(height, 10) + '%';
        bar.title = `${dayXP[i]} XP`;
        
        // Highlight today
        if (i === currentDayIndex) {
            bar.classList.add('today');
            bar.style.opacity = '1';
        } else {
            bar.classList.remove('today');
            bar.style.opacity = '0.5';
        }
    });
}

document.addEventListener('DOMContentLoaded', fetchProgressData);
