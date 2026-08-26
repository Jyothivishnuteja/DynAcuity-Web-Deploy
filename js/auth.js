/**
 * auth.js
 * Handles authentication for DynAcuity Web (Login & Signup)
 * Connects to the Django backend API.
 */

// ============================================================
// BACKEND URL
// ============================================================

const BASE_URL = 'https://dynacuity-backend-6.onrender.com/api';


// ============================================================
// THEME
// ============================================================

/**
 * Apply the saved theme to the document
 */
function applyGlobalTheme() {
    const theme = localStorage.getItem('dynacuity_theme') || 'dark';

    if (theme === 'light') {
        document.documentElement.classList.add('light-mode');
    } else {
        document.documentElement.classList.remove('light-mode');
    }
}

// Apply theme immediately
applyGlobalTheme();


// ============================================================
// SESSION
// ============================================================

/**
 * Save user session data to localStorage
 */
function setSession(data) {
    localStorage.setItem('dynacuity_token', data.token);
    localStorage.setItem(
        'dynacuity_user',
        JSON.stringify(data.user)
    );
}


// ============================================================
// LOGIN
// ============================================================

/**
 * Handle Login
 */
async function login(email, password) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        alert("Please enter correct email");
        return;
    }

    try {
        const response = await fetch(
            `${BASE_URL}/auth/login/`,
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        const data = await response.json();

        if (response.ok) {
            setSession(data);

            if (typeof SoundManager !== 'undefined') {
                SoundManager.playSuccess();
            }

            window.location.href = '../dashboard.html';

        } else {
            let errorMsg = 'Login failed';

            if (typeof data === 'string') {
                errorMsg = data;

            } else if (data.non_field_errors) {
                errorMsg = Array.isArray(data.non_field_errors)
                    ? data.non_field_errors[0]
                    : data.non_field_errors;

            } else if (data.message) {
                errorMsg = data.message;

            } else if (data.error) {
                errorMsg = data.error;

            } else if (data.detail) {
                errorMsg = data.detail;
            }

            throw new Error(errorMsg);
        }

    } catch (error) {
        console.error('Login Error:', error);
        alert(error.message);
    }
}


// ============================================================
// PASSWORD VALIDATION
// ============================================================

/**
 * Validate password based on rules:
 * - One capital letter
 * - One special character
 * - Less than 15 characters
 */
function validatePassword(password) {
    if (!password) {
        return "Password is required";
    }

    if (password.length >= 15) {
        return "Password must be less than 15 characters";
    }

    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one capital letter";
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return "Password must contain at least one special character";
    }

    return null;
}


// ============================================================
// SIGNUP OTP
// ============================================================

/**
 * Request Signup OTP
 */
async function requestSignupOtp(email) {
    try {
        const response = await fetch(
            `${BASE_URL}/auth/register/otp/`,
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    email
                })
            }
        );

        const data = await response.json();

        if (response.ok) {
            return {
                success: true,
                message: data.message
            };

        } else {
            let errorMsg = 'Failed to send code';

            if (data.email) {
                errorMsg = Array.isArray(data.email)
                    ? data.email[0]
                    : data.email;

            } else if (data.error) {
                errorMsg = data.error;

            } else if (data.message) {
                errorMsg = data.message;
            }

            return {
                success: false,
                error: errorMsg
            };
        }

    } catch (error) {
        console.error('Request OTP Error:', error);

        return {
            success: false,
            error: 'Connection error. Please try again.'
        };
    }
}


// ============================================================
// SIGNUP
// ============================================================

/**
 * Handle Signup
 */
async function signup(userData) {
    const passwordError =
        validatePassword(userData.password);

    if (passwordError) {
        alert(passwordError);
        return;
    }

    try {
        const response = await fetch(
            `${BASE_URL}/auth/register/`,
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify(userData)
            }
        );

        const data = await response.json();

        if (response.ok) {
            setSession(data);

            if (typeof SoundManager !== 'undefined') {
                SoundManager.playSuccess();
            }

            window.location.href = '../dashboard.html';

        } else {
            let errorMsg = 'Signup failed';

            if (typeof data === 'object') {

                if (data.otp) {
                    errorMsg = Array.isArray(data.otp)
                        ? data.otp[0]
                        : data.otp;

                } else if (data.email) {
                    errorMsg = Array.isArray(data.email)
                        ? data.email[0]
                        : data.email;

                } else {
                    errorMsg =
                        Object.values(data)
                            .flat()
                            .join('\n');
                }

            } else if (typeof data === 'string') {
                errorMsg = data;
            }

            throw new Error(errorMsg);
        }

    } catch (error) {
        console.error('Signup Error:', error);
        alert(error.message);
    }
}


// ============================================================
// GOOGLE LOGIN
// ============================================================

/**
 * Handle Google Login
 */
async function googleLogin(response) {
    try {
        const base64Url =
            response.credential.split('.')[1];

        const base64 =
            base64Url
                .replace(/-/g, '+')
                .replace(/_/g, '/');

        const jsonPayload =
            decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(function (c) {
                        return '%' +
                            ('00' +
                                c.charCodeAt(0)
                                    .toString(16))
                                .slice(-2);
                    })
                    .join('')
            );

        const payload =
            JSON.parse(jsonPayload);

        const googleData = {
            idToken: response.credential,
            email: payload.email,
            full_name: payload.name
        };

        const res = await fetch(
            `${BASE_URL}/auth/google/`,
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify(googleData)
            }
        );

        const data = await res.json();

        if (res.ok) {
            setSession(data);

            window.location.href =
                '../dashboard.html';

        } else {
            throw new Error(
                data.message ||
                data.error ||
                'Google Login failed'
            );
        }

    } catch (error) {
        console.error(
            'Google Login Error:',
            error
        );

        alert(error.message);
    }
}


// ============================================================
// LOGOUT
// ============================================================

/**
 * Logout
 */
function logout() {
    localStorage.removeItem('dynacuity_token');
    localStorage.removeItem('dynacuity_user');

    window.location.href =
        'auth/login.html';
}


// ============================================================
// GAME RESULTS
// ============================================================

/**
 * Submit Game Result to Backend
 */
async function submitResult(resultData) {
    const token =
        localStorage.getItem('dynacuity_token');

    if (!token) {
        return;
    }

    try {
        const response = await fetch(
            `${BASE_URL}/results/`,
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },

                body: JSON.stringify(resultData)
            }
        );

        if (response.ok) {

            // Track Playtime
            const today =
                new Date().toLocaleDateString();

            const lastDate =
                localStorage.getItem('lastPlayDate');

            let todayMinutes =
                parseInt(
                    localStorage.getItem('todayMinutes')
                ) || 0;

            if (today !== lastDate) {

                localStorage.setItem(
                    'lastPlayDate',
                    today
                );

                todayMinutes = 1;

            } else {
                todayMinutes += 1;
            }

            localStorage.setItem(
                'todayMinutes',
                todayMinutes
            );
        } else {
            const errData = await response.json().catch(() => ({}));
            console.error('Error saving result:', response.status, errData);
            alert(`Failed to save game score to server. Error ${response.status}: ${errData.detail || errData.error || 'Server error'}`);
        }

    } catch (error) {
        console.error(
            'Error syncing result:',
            error
        );
        alert(`Failed to save game score due to network error: ${error.message}`);
    }
}


// ============================================================
// PASSWORD RESET OTP
// ============================================================

/**
 * Request Password Reset (OTP)
 */
async function requestPasswordReset(email) {
    try {
        const response = await fetch(
            `${BASE_URL}/auth/forgot-password/`,
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    email
                })
            }
        );

        if (response.ok) {
            return true;
        }

        const data = await response.json();

        throw new Error(
            data.error ||
            'Failed to request reset'
        );

    } catch (error) {
        alert(error.message);
        return false;
    }
}


// ============================================================
// RESET PASSWORD
// ============================================================

/**
 * Reset Password
 */
async function resetPassword(
    email,
    otp,
    new_password
) {
    const passwordError =
        validatePassword(new_password);

    if (passwordError) {
        alert(passwordError);
        return false;
    }

    try {
        const response = await fetch(
            `${BASE_URL}/auth/reset-password/`,
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    email,
                    otp,
                    new_password
                })
            }
        );

        if (response.ok) {
            return true;
        }

        const data = await response.json();

        throw new Error(
            data.error ||
            'Failed to reset password'
        );

    } catch (error) {
        alert(error.message);
        return false;
    }
}


// ============================================================
// STAR RATINGS
// ============================================================

/**
 * Display Star Ratings in a container
 */
function displayStars(containerId, count) {
    const container =
        document.getElementById(containerId);

    if (!container) {
        return;
    }

    let html = '';

    for (let i = 0; i < 5; i++) {

        if (i < count) {

            html +=
                '<span style="color: #fbbf24; font-size: 2.5rem; margin: 0 4px;">⭐</span>';

        } else {

            html +=
                '<span style="color: #374151; font-size: 2.5rem; margin: 0 4px;">☆</span>';
        }
    }

    container.innerHTML = html;
}


// ============================================================
// AUTHENTICATION CHECK
// ============================================================

/**
 * Check if the user is currently authenticated
 */
function isAuthenticated() {
    return localStorage.getItem(
        'dynacuity_token'
    ) !== null;
}


// ============================================================
// CURRENT USER
// ============================================================

/**
 * Get the currently logged in user data
 */
function getCurrentUser() {
    const userData =
        localStorage.getItem(
            'dynacuity_user'
        );

    return userData
        ? JSON.parse(userData)
        : null;
}


// ============================================================
// GET GAME RESULTS
// ============================================================

/**
 * Fetch all game results for the current user
 */
async function getGameResults() {
    const token =
        localStorage.getItem('dynacuity_token');

    if (!token) {
        return [];
    }

    try {
        const response = await fetch(
            `${BASE_URL}/results/`,
            {
                headers: {
                    'Authorization': `Token ${token}`
                }
            }
        );

        if (response.ok) {
            return await response.json();
        }

    } catch (error) {
        console.error(
            'Error fetching results:',
            error
        );
    }

    return [];
}


// ============================================================
// RESULTS TABLE
// ============================================================

/**
 * Render a results table into a container
 * (Matching Android App Look)
 */
function renderResultsTable(
    results,
    containerId,
    limit = 5
) {
    const container =
        document.getElementById(containerId);

    if (!container) {
        return;
    }

    if (!results || results.length === 0) {
        container.innerHTML =
            '<p style="color: #666; font-size: 0.8rem; margin: 1rem 0;">No sessions recorded yet.</p>';

        return;
    }

    const displayResults =
        limit
            ? results.slice(0, limit)
            : results;

    let html = `
        <div style="margin-top: 1.5rem; text-align: left; background: transparent; border-radius: 0; padding: 0;">
            <div style="font-size: 1.1rem; font-weight: 800; color: #fff; margin-bottom: 1.5rem; font-family: 'Outfit';">
                Performance Dataset (db.sqlite)
            </div>

            <!-- Table Header -->
            <div style="display: flex; padding-bottom: 10px; margin-bottom: 5px; color: #666; font-size: 0.65rem; font-weight: 800; text-transform: uppercase;">
                <div style="flex: 1;">SCORE</div>
                <div style="flex: 3; padding-left: 4px;">GAME / LEVEL</div>
                <div style="flex: 1; text-align: center;">ACC</div>
                <div style="flex: 1; text-align: center;">SPEED</div>
                <div style="flex: 2; text-align: right;">DATE / TIME</div>
                <div style="width: 32px; text-align: center;">#</div>
            </div>

            <div style="display: flex; flex-direction: column;">
    `;

    displayResults.forEach((r, index) => {

        let dateStr =
            r.created_at ||
            r.timestamp;

        if (
            dateStr &&
            typeof dateStr === 'string' &&
            !dateStr.endsWith('Z') &&
            !dateStr.includes('+')
        ) {
            dateStr += 'Z';
        }

        const dateObj =
            new Date(dateStr);

        const date =
            dateObj.toLocaleDateString(
                [],
                {
                    month: '2-digit',
                    day: '2-digit'
                }
            ) +
            ' ' +
            dateObj.toLocaleTimeString(
                [],
                {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }
            );

        const accuracy =
            r.accuracy !== null &&
            r.accuracy !== undefined
                ? Math.round(r.accuracy) + '%'
                : '--';

        const avgResp =
            r.avg_time !== null &&
            r.avg_time !== undefined
                ? (
                    typeof r.avg_time === 'number'
                        ? r.avg_time.toFixed(0) + 'ms'
                        : r.avg_time
                )
                : '--';

        const hits =
            r.correct_count !== null &&
            r.correct_count !== undefined
                ? r.correct_count
                : '--';

        // Check if this is a high score
        const isBest =
            r.score > 20 ||
            (
                r.game_name === 'Shape Match' &&
                r.score > 800
            );

        const scoreColor =
            isBest
                ? '#22c55e'
                : '#fff';

        html += `
            <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.02); min-height: 40px;">

                <!-- Column 1: Score -->
                <div style="flex: 1; font-size: 0.85rem; font-weight: 800; color: ${scoreColor};">
                    ${r.score}
                </div>

                <!-- Column 2: Game / Level -->
                <div style="flex: 3; padding-left: 4px;">
                    <div style="color: #eee; font-weight: 600; font-size: 0.75rem;">
                        ${r.game_name}
                    </div>

                    <div style="font-size: 0.65rem; color: #666;">
                        ${r.level_info || 'Standard'}
                    </div>
                </div>

                <!-- Column 3: Accuracy -->
                <div style="flex: 1; text-align: center; color: #8B5CF6; font-weight: 800; font-size: 0.75rem;">
                    ${accuracy}
                </div>

                <!-- Column 4: Speed -->
                <div style="flex: 1; text-align: center; color: #666; font-size: 0.7rem;">
                    ${avgResp}
                </div>

                <!-- Column 5: Date -->
                <div style="flex: 2; text-align: right; color: #666; font-size: 0.65rem; white-space: nowrap;">
                    ${date}
                </div>

                <!-- Column 6: Index -->
                <div style="width: 32px; text-align: center; color: #333; font-size: 0.7rem;">
                    ${index + 1}
                </div>

            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    container.innerHTML = html;
}
