// js/login.js - Module xác thực đăng nhập với phân quyền

const AUTH_CONFIG = {
    USERS: {
        'KV1ADZ': { role: 'KV1', displayName: 'KV1' },
        'KV2ZAC': { role: 'KV2', displayName: 'KV2' },
        'KV3CCC': { role: 'KV3', displayName: 'KV3' },
        'KV4YXY': { role: 'KV4', displayName: 'KV4' },
        'KV5XXZ': { role: 'KV5', displayName: 'KV5' },
        'KV6XBC': { role: 'KV6', displayName: 'KV6' },
        'KV7ZZA': { role: 'KV7', displayName: 'KV7', accessScope: 'Miền Trung' },
        '99': { role: 'ADMIN', displayName: 'ADMIN' }
    }
};

class AuthManager {
    constructor() {
        this.loginOverlay = null;
        this.mainContent = null;
        this.currentUser = null;
    }

    init() {
        this.loginOverlay = document.getElementById('loginOverlay');
        this.mainContent = document.getElementById('mainApp');
        this.showLoginForm();
        this.setupEnterKey();
    }

    verifyCode(code) {
        if (!code) return false;
        const trimmedCode = code.trim().toUpperCase();
        return AUTH_CONFIG.USERS[trimmedCode] || false;
    }

    async login() {
        const codeInput = document.getElementById('accessCode');
        const loginBtn = document.querySelector('.login-btn');
        const errorDiv = document.getElementById('loginError');
        
        const code = codeInput ? codeInput.value : '';
        
        if (loginBtn) {
            loginBtn.classList.add('loading');
            loginBtn.disabled = true;
        }
        
        // Delay nhẹ để thấy hiệu ứng
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const user = this.verifyCode(code);
        if (user) {
            this.currentUser = {
                role: user.role,
                displayName: user.displayName,
                accessScope: user.accessScope || user.role,
                accessCode: code.trim().toUpperCase()
            };
            this.showMainContent();
            if (errorDiv) errorDiv.style.display = 'none';
            
            if (typeof window.onLoginSuccess === 'function') {
                window.onLoginSuccess(this.currentUser);
            }
        } else {
            if (errorDiv) {
                errorDiv.style.display = 'flex';
                setTimeout(() => {
                    errorDiv.style.display = 'none';
                }, 2000);
            }
            
            if (codeInput) {
                codeInput.classList.add('shake');
                setTimeout(() => codeInput.classList.remove('shake'), 500);
            }
        }
        
        if (loginBtn) {
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    }

    showLoginForm() {
        if (this.loginOverlay) {
            this.loginOverlay.style.display = 'flex';
        }
        if (this.mainContent) {
            this.mainContent.style.display = 'none';
        }
        
        const codeInput = document.getElementById('accessCode');
        if (codeInput) {
            setTimeout(() => codeInput.focus(), 100);
        }
    }

    showMainContent() {
        if (this.loginOverlay) {
            this.loginOverlay.style.display = 'none';
        }
        if (this.mainContent) {
            this.mainContent.style.display = 'block';
        }
    }

    setupEnterKey() {
        const codeInput = document.getElementById('accessCode');
        if (codeInput) {
            codeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.login();
                }
            });
        }
    }
}

// Khởi tạo toàn cục
window.AuthManager = AuthManager;
window.authInstance = null;

function initAuth() {
    if (!window.authInstance) {
        window.authInstance = new AuthManager();
        window.authInstance.init();
    }
    return window.authInstance;
}