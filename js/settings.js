const API_BASE = "https://dynacuity-backend-6.onrender.com/api";

// Available avatars to choose from
const AVATAR_OPTIONS = [
    "avatar.png", "avatar_male.png", "avatar_male_2.png", "avatar_male_3.png", "avatar_male_4.png",
    "avatar_female.png", "avatar_female_2.png", "avatar_female_3.png", "avatar_female_4.png"
];
let selectedAvatar = "avatar.png";

async function loadSettingsProfile() {
    const token = localStorage.getItem('dynacuity_token');
    if (!token) {
        window.location.href = 'auth/login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/user/`, {
            headers: {
                'Authorization': `Token ${token}`,
                'ngrok-skip-browser-warning': 'true'
            }
        });

        if (response.ok) {
            const user = await response.json();

            // Update local storage to stay in sync
            const currentSession = JSON.parse(localStorage.getItem('dynacuity_user') || '{}');
            const updatedSession = { ...currentSession, ...user };
            localStorage.setItem('dynacuity_user', JSON.stringify(updatedSession));

            document.getElementById('displayName').innerText = user.username || user.first_name || 'User';
            document.getElementById('displayEmail').innerText = user.email;

            if (user.avatar) {
                document.getElementById('displayAvatar').src = `assets/images/${user.avatar}`;
                selectedAvatar = user.avatar;
            }

            // Pre-fill form
            document.getElementById('inputFullName').value = user.full_name || user.first_name || '';
            document.getElementById('inputEmail').value = user.email || '';
            document.getElementById('inputAge').value = user.age || '';
            document.getElementById('inputGender').value = user.gender || 'Prefer not to say';
            document.getElementById('inputPhone').value = user.phone_number || '';
        }
    } catch (e) {
        console.error("Profile load failed", e);
    }
}

function setupAvatarGrid() {
    const grid = document.getElementById('avatarSelectionGrid');
    if (!grid) return;
    grid.innerHTML = '';

    AVATAR_OPTIONS.forEach(avatar => {
        const img = document.createElement('img');
        img.src = `assets/images/${avatar}`;
        img.alt = avatar;
        img.className = 'avatar-option-img';
        img.style.width = '100%';
        img.style.aspectRatio = '1 / 1';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '50%';
        img.style.cursor = 'pointer';
        img.style.border = '3px solid transparent';
        img.style.transition = '0.2s';

        if (avatar === selectedAvatar) {
            img.style.borderColor = 'var(--primary-purple)';
            img.style.transform = 'scale(1.1)';
        }

        img.onclick = () => {
            selectedAvatar = avatar;
            setupAvatarGrid(); // Re-render to update highlights
        };

        grid.appendChild(img);
    });
}

function handleLogout() {
    localStorage.removeItem('dynacuity_token');
    localStorage.removeItem('dynacuity_user');
    window.location.href = 'index.html';
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const token = localStorage.getItem('dynacuity_token');
    if (!token) return;

    const fullName = document.getElementById('inputFullName').value;
    const email = document.getElementById('inputEmail').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("Please enter correct email");
        return;
    }

    submitBtn.innerText = 'Saving...';
    submitBtn.disabled = true;

    const payload = {
        full_name: fullName,
        email: email,
        age: document.getElementById('inputAge').value,
        gender: document.getElementById('inputGender').value,
        phone_number: document.getElementById('inputPhone').value,
        avatar: selectedAvatar
    };

    try {
        const response = await fetch(`${API_BASE}/auth/user/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            // Update local storage
            const currentSession = JSON.parse(localStorage.getItem('dynacuity_user') || '{}');
            localStorage.setItem('dynacuity_user', JSON.stringify({ ...currentSession, ...data }));

            // Update UI
            document.getElementById('displayName').innerText = data.username || data.full_name || data.first_name || 'User';
            document.getElementById('displayEmail').innerText = data.email;
            if (data.avatar) {
                document.getElementById('displayAvatar').src = `assets/images/${data.avatar}`;
            }

            // Close modal
            document.getElementById('editProfileModal').style.display = 'none';
        } else {
            console.error("Failed to update profile", data);
            alert('Failed to update profile: ' + (data.error || JSON.stringify(data)));
        }
    } catch (e) {
        console.error("Profile update error", e);
        alert('An error occurred while updating the profile.');
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
}

// Settings Logic
function initSettings() {
    const toggleTheme = document.getElementById('toggleTheme');
    const toggleSound = document.getElementById('toggleSound');

    // Load saved settings
    const theme = localStorage.getItem('dynacuity_theme') || 'dark';
    const sounds = localStorage.getItem('dynacuity_sounds') !== 'false';
    const bgm = localStorage.getItem('dynacuity_bgm') === 'true'; // Default off to be polite

    if (toggleTheme) toggleTheme.checked = theme === 'dark';
    if (toggleSound) toggleSound.checked = sounds;
    if (toggleBGM) toggleBGM.checked = bgm;

    applyTheme(theme);

    // listeners
    if (toggleTheme) {
        toggleTheme.onchange = () => {
            const newTheme = toggleTheme.checked ? 'dark' : 'light';
            localStorage.setItem('dynacuity_theme', newTheme);
            applyTheme(newTheme);
        };
    }

    if (toggleSound) {
        toggleSound.onchange = () => {
            localStorage.setItem('dynacuity_sounds', toggleSound.checked);
            if (toggleSound.checked && typeof SoundManager !== 'undefined') {
                SoundManager.playClick();
            }
        };
    }

    if (toggleBGM) {
        toggleBGM.onchange = () => {
            localStorage.setItem('dynacuity_bgm', toggleBGM.checked);
            if (toggleBGM.checked && typeof SoundManager !== 'undefined') {
                SoundManager.startBGM();
            } else if (typeof SoundManager !== 'undefined') {
                SoundManager.stopBGM();
            }
        };
    }
}

function applyTheme(theme) {
    if (theme === 'light') {
        document.documentElement.classList.add('light-mode');
    } else {
        document.documentElement.classList.remove('light-mode');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadSettingsProfile();
    initSettings();

    const editBtn = document.getElementById('editProfileBtn');
    if (editBtn) {
        editBtn.onclick = () => {
            setupAvatarGrid();
            document.getElementById('editProfileModal').style.display = 'flex';
        };
    }

    const form = document.getElementById('editProfileForm');
    if (form) {
        form.onsubmit = handleProfileUpdate;
    }
});
