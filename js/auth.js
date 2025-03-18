// Authentication and login page management
const AUTH_STATE = {
    LOGGED_OUT: 'logged_out',
    LOGGING_IN: 'logging_in',
    LOGGED_IN: 'logged_in',
    VALIDATION: 'validation'
};

let currentAuthState = AUTH_STATE.LOGGED_OUT;
let validationTimer = null;

function createLeaf() {
    const leaf = document.createElement('div');
    leaf.className = 'leaf';
    
    // Create SVG leaf shape
    const leafSvg = `
    <svg viewBox="0 0 100 100" width="40" height="40">
        <path fill="#4CAF50" d="M50,5 C65,5 85,25 85,45 C85,65 70,85 50,95 C30,85 15,65 15,45 C15,25 35,5 50,5 Z" />
        <path fill="#388E3C" d="M50,15 C60,15 75,30 75,45 C75,60 65,75 50,82 C35,75 25,60 25,45 C25,30 40,15 50,15 Z" />
        <path fill="#2E7D32" d="M50,25 C55,25 65,35 65,45 C65,55 55,65 50,70 C45,65 35,55 35,45 C35,35 45,25 50,25 Z" />
        <path fill="#1B5E20" d="M50,40 L55,50 L50,60 L45,50 Z" />
    </svg>`;
    
    leaf.innerHTML = leafSvg;
    
    // Random initial position and animation properties
    const startX = Math.random() * 100;
    leaf.style.left = startX + 'vw';
    
    // Randomize fall speed and pattern
    const duration = Math.random() * 3 + 4;
    const delay = Math.random() * 3;
    const rotationSpeed = Math.random() * 180 - 90;
    const swayAmplitude = Math.random() * 60 + 40;
    const swayFrequency = Math.random() * 1.5 + 0.8;
    
    leaf.style.animationDuration = duration + 's';
    leaf.style.animationDelay = delay + 's';
    leaf.style.opacity = Math.random() * 0.4 + 0.4;
    
    // Apply custom animations
    leaf.style.animation = `
        fall ${duration}s linear ${delay}s forwards,
        sway ${swayFrequency}s ease-in-out infinite,
        rotate ${duration / 2}s linear infinite
    `;
    
    // Add custom properties for dynamic movement
    leaf.style.setProperty('--rotation-speed', rotationSpeed + 'deg');
    leaf.style.setProperty('--sway-amplitude', swayAmplitude + 'px');
    
    document.body.appendChild(leaf);
    leaf.addEventListener('animationend', (e) => {
        if (e.animationName === 'fall') {
            leaf.remove();
        }
    });
}

function startLeafAnimation() {
    // Create initial leaves
    for (let i = 0; i < 10; i++) {
        createLeaf();
    }
    // Continue creating leaves at a regular interval
    setInterval(createLeaf, 300);
}

export function initializeAuth() {
    const loginContainer = document.createElement('div');
    loginContainer.id = 'login-container';
    
    // Start the leaf animation
    startLeafAnimation();
    document.body.style.background = 'linear-gradient(-45deg, #1a2a6c, #b21f1f, #fdbb2d)';
    document.body.style.backgroundSize = '400% 400%';
    document.body.style.animation = 'gradient 15s ease infinite';
    loginContainer.innerHTML = `
        <div class="login-box">
            <h2>Welcome to Virtual Garden</h2>
            <form id="login-form">
                <div class="input-group">
                    <input type="email" id="email" required>
                    <label for="email">Email</label>
                    <span class="highlight"></span>
                </div>
                <div class="input-group">
                    <input type="password" id="password" required>
                    <label for="password">Password</label>
                    <span class="highlight"></span>
                </div>
                <button type="submit" class="login-button">
                    <span class="button-text">Login</span>
                    <span class="button-loader"></span>
                </button>
            </form>
        </div>
    `;
    document.body.appendChild(loginContainer);

    // Add event listeners
    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    form.addEventListener('submit', handleLogin);
    
    // Real-time validation
    emailInput.addEventListener('input', () => validateField(emailInput, validateEmail));
    passwordInput.addEventListener('input', () => validateField(passwordInput, validatePassword));

    // Add input animations
    const inputs = document.querySelectorAll('.input-group input');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        input.addEventListener('blur', () => {
            if (!input.value) {
                input.parentElement.classList.remove('focused');
            }
        });
    });
}

function validateField(input, validationFn) {
    clearTimeout(validationTimer);
    currentAuthState = AUTH_STATE.VALIDATION;

    validationTimer = setTimeout(() => {
        const isValid = validationFn(input.value);
        const errorElement = input.parentElement.querySelector('.error-message');
        
        if (errorElement) {
            errorElement.remove();
        }

        if (!isValid && input.value) {
            const error = document.createElement('div');
            error.className = 'error-message';
            error.textContent = `Invalid ${input.id}`;
            input.parentElement.appendChild(error);
            input.style.borderColor = '#ff5252';
        } else {
            input.style.borderColor = input.value ? '#4CAF50' : '';
        }
    }, 500);
}

function validatePassword(password) {
    return password.length >= 6;
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginButton = document.querySelector('.login-button');
    const loginBox = document.querySelector('.login-box');
    
    // Basic validation
    if (!validateEmail(email)) {
        showError('Please enter a valid email address');
        return;
    }
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters long');
        return;
    }

    // Show loading state
    currentAuthState = AUTH_STATE.LOGGING_IN;
    loginButton.classList.add('loading');

    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // For demo purposes, accept any valid email/password
        currentAuthState = AUTH_STATE.LOGGED_IN;
        
        // Success animation
        loginBox.style.transform = 'scale(0.95)';
        loginBox.style.opacity = '0.8';
        
        setTimeout(() => {
            const loginContainer = document.getElementById('login-container');
            loginContainer.classList.add('fade-out');
            
            setTimeout(() => {
                loginContainer.remove();
                // Initialize the 3D scene
                if (typeof window.initializeVirtualGarden === 'function') {
                    window.initializeVirtualGarden();
                } else {
                    console.error('Virtual Garden initialization function not found');
                }
            }, 1000);
        }, 300);

    } catch (error) {
        showError('Login failed. Please try again.');
        currentAuthState = AUTH_STATE.LOGGED_OUT;
    } finally {
        loginButton.classList.remove('loading');
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showError(message) {
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const form = document.getElementById('login-form');
    form.appendChild(errorDiv);
    
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 3000);
}