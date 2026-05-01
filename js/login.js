// js/login.js - Module xác thực đăng nhập (không lưu phiên)

const AUTH_CONFIG = {
    ACCESS_CODE: 'ADMIN99'  // Mã cố định, không phân biệt hoa thường
};

class AuthManager {
    constructor() {
        this.loginOverlay = null;
        this.mainContent = null;
    }

    init() {
        this.loginOverlay = document.getElementById('loginOverlay');
        this.mainContent = document.getElementById('mainApp');
        this.showLoginForm();
        this.setupEnterKey();
    }

    verifyCode(code) {
        return code && code.trim().toUpperCase() === AUTH_CONFIG.ACCESS_CODE;
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
        
        if (this.verifyCode(code)) {
            this.showMainContent();
            if (errorDiv) errorDiv.style.display = 'none';
            
            // Gọi callback sau khi đăng nhập thành công
            if (typeof window.onLoginSuccess === 'function') {
                window.onLoginSuccess();
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