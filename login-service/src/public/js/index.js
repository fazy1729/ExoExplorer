// App State
const state = {
    currentScreen: 'login', // 'login', 'signup', 'dashboard'
    user: null,
    profileImage: null,
    galleryImages: []
};
// DOM Elements
const authScreens = document.getElementById('auth-screens');
const loginScreen = document.getElementById('login-screen');
const signupScreen = document.getElementById('signup-screen');
const dashboard = document.getElementById('dashboard');
const showLoginBtn = document.getElementById('show-login');
const showSignupBtn = document.getElementById('show-signup');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const profileImageInput = document.getElementById('profile-image');
const profilePreview = document.getElementById('profile-preview');
const profileIcon = document.getElementById('profile-icon');
const galleryUpload = document.getElementById('gallery-upload');
const galleryPreview = document.getElementById('gallery-preview');
const mobileMenuBtn = document.querySelector('[aria-controls="mobile-menu"]');
const mobileMenu = document.getElementById('mobile-menu');
// Initialize App
function initApp() {
    showScreen('login');

    // Event Listeners
    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showScreen('login');
    });

    showSignupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showScreen('signup');
    });

    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);

    profileImageInput.addEventListener('change', handleProfileImageUpload);
    galleryUpload.addEventListener('change', handleGalleryUpload);

    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
}
// Show Screen
function showScreen(screen) {
    state.currentScreen = screen;

    loginScreen.classList.add('hidden');
    signupScreen.classList.add('hidden');
    dashboard.classList.add('hidden');
    authScreens.classList.remove('hidden');

    if (screen === 'login') {
        loginScreen.classList.remove('hidden');
    } else if (screen === 'signup') {
        signupScreen.classList.remove('hidden');
    } else if (screen === 'dashboard') {
        authScreens.classList.add('hidden');
        dashboard.classList.remove('hidden');
        updateDashboard();
    }
}
// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Login failed:', error);
            alert(error.error || 'Login failed');
            return;
        }

        const data = await response.json();
        console.log('Login successful:', data);

        // Update state with user data
        state.user = {
            name: data.name,
            email: email,
            // profession: data.profession || 'Unknown',
            // bio: data.bio || 'No bio provided',
            // profileImage: data.profileImage || 'https://via.placeholder.com/150',
            // galleryImages: data.galleryImages || [],
        };

        setTimeout(() => {
            window.location.href = 'http://localhost:8000/';
        }, 200);
    } 
        catch (err) {
        console.error('Error during login:', err);
        alert('An error occurred while logging in. Please try again.');
    }
}
// Handle Signup
async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const profession = document.getElementById('signup-profession').value;
    const bio = document.getElementById('signup-bio').value;

    try {
        const response = await fetch('http://localhost:3001/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password}),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Signup failed:', error);
            alert(error.error || 'Signup failed');
            return;
        }

        const data = await response.json();
        console.log('Signup successful:', data);

        // Automatically log in the user after signup
        state.user = {
            name: name,
            email: email,
            profession: profession,
            bio: bio,
            profileImage: state.profileImage || 'https://via.placeholder.com/150',
            galleryImages: state.galleryImages.length > 0 ? state.galleryImages : [],
        };

        setTimeout(() => {
            window.location.href = 'http://localhost:8000/';
        }, 200);  
    } 
        
        catch (err) {
        console.error('Error during signup:', err);
        alert('An error occurred while signing up. Please try again.');
    }
}
// Handle Profile Image Upload
function handleProfileImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            profilePreview.src = event.target.result;
            profilePreview.classList.remove('hidden');
            profileIcon.classList.add('hidden');
            state.profileImage = event.target.result;
        };
        reader.readAsDataURL(file);
    }
}
// Handle Gallery Upload
function handleGalleryUpload(e) {
    const files = e.target.files;
    if (files.length > 0) {
        // Clear existing preview except the add button
        galleryPreview.innerHTML = '<div class="bg-gray-200 rounded-lg h-20 flex items-center justify-center cursor-pointer" onclick="document.getElementById(\'gallery-upload\').click()"><i class="fas fa-plus text-gray-500"></i></div>';

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();

            reader.onload = function (event) {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'relative';

                const img = document.createElement('img');
                img.src = event.target.result;
                img.className = 'gallery-image';

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100';
                deleteBtn.innerHTML = '<i class="fas fa-times text-red-500 text-xs"></i>';
                deleteBtn.onclick = function () {
                    imgContainer.remove();
                };

                imgContainer.appendChild(img);
                imgContainer.appendChild(deleteBtn);

                // Insert before the add button
                galleryPreview.insertBefore(imgContainer, galleryPreview.firstChild);

                // Save to state
                state.galleryImages.push(event.target.result);
            };

            reader.readAsDataURL(file);
        }
    }
}
// Update Dashboard with User Data
function updateDashboard() {
    if (!state.user) return;

    // Profile Images
    document.getElementById('nav-profile-img').src = state.user.profileImage;
    document.getElementById('mobile-profile-img').src = state.user.profileImage;
    document.getElementById('dashboard-profile-img').src = state.user.profileImage;

    // Profile Info
    document.getElementById('dashboard-profile-name').textContent = state.user.name;
    document.getElementById('mobile-profile-name').textContent = state.user.name;
    document.getElementById('mobile-profile-email').textContent = state.user.email;

    // Profession
    const professionMap = {
        'waiter': 'Waiter/Waitress',
        'barista': 'Barista',
        'bartender': 'Bartender',
        'content-creator': 'Content Creator',
        'musician': 'Musician',
        'other': 'Professional'
    };
    const professionText = professionMap[state.user.profession] || 'Professional';
    document.getElementById('dashboard-profile-profession').textContent = professionText;

    // Bio
    document.getElementById('dashboard-profile-bio').textContent = state.user.bio || 'No bio yet';

    // // Tip Link
    // const username = state.user.name.toLowerCase().replace(/\s+/g, '');
    // document.getElementById('tip-link').value = `tipme.com/${username}`;

    // // Gallery
    // const dashboardGallery = document.getElementById('dashboard-gallery');
    // dashboardGallery.innerHTML = '';

    // state.user.galleryImages.forEach(imgSrc => {
    //     const imgContainer = document.createElement('div');
    //     imgContainer.className = 'relative';

    //     const img = document.createElement('img');
    //     img.src = imgSrc;
    //     img.className = 'gallery-image';

    //     dashboardGallery.appendChild(imgContainer);
    //     imgContainer.appendChild(img);
    // });
}
// Toggle Mobile Menu
function toggleMobileMenu() {
    const expanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
    mobileMenuBtn.setAttribute('aria-expanded', !expanded);
    mobileMenu.classList.toggle('hidden');
}
// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
