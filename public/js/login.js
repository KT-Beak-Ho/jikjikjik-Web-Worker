// ============================================
// LOGIN.JS - 로그인 전용 모듈
// ============================================

// API 설정 클래스
class ApiConfig {
    constructor() {
        this.baseUrl = this.getApiUrl();
        this.LOGIN_ENDPOINT = '/login';
    }

    getApiUrl() {
        // 브라우저 환경에서 전역 변수 확인 (우선순위 1)
        if (typeof window !== 'undefined' && window.API_BASE_URL) {
            console.log('API URL from window.API_BASE_URL:', window.API_BASE_URL);
            return window.API_BASE_URL;
        }
        
        // 서버에서 주입된 ENV 객체 확인 (우선순위 2)
        if (typeof window !== 'undefined' && window.ENV && window.ENV.API_BASE_URL) {
            console.log('API URL from window.ENV.API_BASE_URL:', window.ENV.API_BASE_URL);
            return window.ENV.API_BASE_URL;
        }
        
        // 기본값 (우선순위 3)
        console.log('API URL: Using default');
        return 'http://localhost:8080';
    }

    async loadConfigFromServer() {
        try {
            console.log('서버에서 환경변수 로드 시도...');
            const response = await fetch('/api/config');
            
            if (response.ok) {
                const config = await response.json();
                console.log('서버 환경변수 로드 성공:', config);
                
                if (config.API_BASE_URL && config.API_BASE_URL !== this.baseUrl) {
                    console.log('API URL 업데이트:', this.baseUrl, '->', config.API_BASE_URL);
                    this.setBaseUrl(config.API_BASE_URL);
                    
                    if (typeof window !== 'undefined') {
                        window.API_BASE_URL = config.API_BASE_URL;
                    }
                }
                
                return config;
            } else {
                console.warn('서버 환경변수 로드 실패:', response.status, response.statusText);
            }
        } catch (error) {
            console.warn('서버에서 환경변수를 가져올 수 없습니다:', error.message);
        }
        return null;
    }

    setBaseUrl(url) {
        this.baseUrl = url;
    }

    getLoginUrl() {
        return this.baseUrl + this.LOGIN_ENDPOINT;
    }
}

// 전역 API 설정 인스턴스
const apiConfig = new ApiConfig();

// DOM 요소
let loginForm;
let loginButton;
let loginIdOrPhoneInput;
let passwordInput;
let loginModal;

// 로그인 모듈 초기화
async function initializeLogin() {
    console.log('로그인 모듈 초기화 시작...');
    await apiConfig.loadConfigFromServer();
    console.log('최종 API URL:', apiConfig.baseUrl);
}

// 비밀번호 표시/숨김 토글
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('loginPassword');
    const eyeIconClosed = document.getElementById('eyeIconClosed');
    const eyeIconOpen = document.getElementById('eyeIconOpen');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIconClosed.style.display = 'none';
        eyeIconOpen.style.display = 'block';
    } else {
        passwordInput.type = 'password';
        eyeIconClosed.style.display = 'block';
        eyeIconOpen.style.display = 'none';
    }
}

// 로그인 모달 표시
function showLoginModal() {
    loginModal = document.getElementById('loginModal');
    loginForm = document.getElementById('loginForm');
    loginButton = document.getElementById('loginButton');
    loginIdOrPhoneInput = document.getElementById('loginIdOrPhone');
    passwordInput = document.getElementById('loginPassword');
    
    if (loginModal) {
        loginModal.classList.add('show');
        
        setTimeout(() => {
            if (loginIdOrPhoneInput) {
                loginIdOrPhoneInput.focus();
            }
        }, 100);
    }
    
    // 이벤트 리스너 설정 (한 번만)
    if (loginForm && !loginForm.hasAttribute('data-listener-added')) {
        loginForm.addEventListener('submit', handleLoginSubmit);
        loginForm.setAttribute('data-listener-added', 'true');
    }
    
    if (loginIdOrPhoneInput && !loginIdOrPhoneInput.hasAttribute('data-listener-added')) {
        loginIdOrPhoneInput.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                validateLoginIdOrPhone(this.value);
            }
        });
        loginIdOrPhoneInput.setAttribute('data-listener-added', 'true');
    }
    
    if (passwordInput && !passwordInput.hasAttribute('data-listener-added')) {
        passwordInput.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                validateLoginPassword(this.value);
            }
        });
        passwordInput.setAttribute('data-listener-added', 'true');
    }
}

// 로그인 모달 닫기
function closeLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.classList.remove('show');
    }
    
    if (loginForm) {
        loginForm.reset();
        removeAllLoginFieldErrors();
        
        // 비밀번호 아이콘 초기화
        const passwordInput = document.getElementById('loginPassword');
        const eyeIconClosed = document.getElementById('eyeIconClosed');
        const eyeIconOpen = document.getElementById('eyeIconOpen');
        
        if (passwordInput && passwordInput.type === 'text') {
            passwordInput.type = 'password';
            if (eyeIconClosed) eyeIconClosed.style.display = 'block';
            if (eyeIconOpen) eyeIconOpen.style.display = 'none';
        }
    }
}

// 로그인 폼 제출 처리
async function handleLoginSubmit(e) {
    e.preventDefault();
    
    const loginIdOrPhone = loginIdOrPhoneInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!validateLoginForm(loginIdOrPhone, password)) {
        return;
    }
    
    setLoginLoadingState(true);
    
    try {
        const deviceToken = getDeviceToken();
        const loginUrl = apiConfig.getLoginUrl();
        
        console.log('로그인 요청:', loginUrl);
        
        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                loginIdOrPhone: loginIdOrPhone,
                password: password,
                deviceToken: deviceToken
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.data) {
            handleLoginSuccess(result.data, result.message);
        } else {
            handleLoginError(result.message || '로그인에 실패했습니다.');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        handleLoginError('서버와의 연결에 실패했습니다. 다시 시도해주세요.');
    } finally {
        setLoginLoadingState(false);
    }
}

// 로그인 폼 유효성 검사
function validateLoginForm(loginIdOrPhone, password) {
    let isValid = true;
    
    if (!loginIdOrPhone) {
        showLoginFieldError(loginIdOrPhoneInput, '아이디 또는 전화번호를 입력해주세요.');
        isValid = false;
    } else if (!validateLoginIdOrPhone(loginIdOrPhone)) {
        isValid = false;
    }
    
    if (!password) {
        showLoginFieldError(passwordInput, '비밀번호를 입력해주세요.');
        isValid = false;
    } else if (!validateLoginPassword(password)) {
        isValid = false;
    }
    
    return isValid;
}

// 아이디/전화번호 유효성 검사
function validateLoginIdOrPhone(value) {
    if (!value) {
        return false;
    }
    
    const idRegex = /^[a-zA-Z0-9]{4,20}$/;
    if (idRegex.test(value)) {
        removeLoginFieldError(loginIdOrPhoneInput);
        return true;
    }
    
    const phoneRegex = /^010-?\d{4}-?\d{4}$/;
    if (phoneRegex.test(value)) {
        removeLoginFieldError(loginIdOrPhoneInput);
        return true;
    }
    
    showLoginFieldError(loginIdOrPhoneInput, '올바른 아이디 또는 전화번호 형식이 아닙니다.');
    return false;
}

// 비밀번호 유효성 검사
function validateLoginPassword(value) {
    if (!value) {
        return false;
    }
    
    if (value.length < 8) {
        showLoginFieldError(passwordInput, '비밀번호는 8자 이상이어야 합니다.');
        return false;
    }
    
    removeLoginFieldError(passwordInput);
    return true;
}

// 로그인 성공 처리
function handleLoginSuccess(data, message) {
    // 로컬 스토리지에 저장
    localStorage.setItem('memberId', data.memberId);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('role', data.role);
    localStorage.setItem('isLoggedIn', 'true');
    
    // app.js의 showNotification 사용
    if (typeof showNotification === 'function') {
        showNotification(message || '로그인 성공!', 'success');
    }
    
    closeLoginModal();
    
    // 대시보드 페이지로 이동
    setTimeout(() => {
        if (typeof showPage === 'function') {
            showPage('dashboard');
            updateNavigation('home');
        }
    }, 500);
}

// 로그인 실패 처리
function handleLoginError(message) {
    // app.js의 showNotification 사용
    if (typeof showNotification === 'function') {
        showNotification(message, 'error');
    }
    
    if (passwordInput) {
        passwordInput.value = '';
        passwordInput.focus();
    }
}

// 디바이스 토큰 가져오기
function getDeviceToken() {
    return localStorage.getItem('deviceToken') || 'web_device_token';
}

// 로딩 상태 설정
function setLoginLoadingState(isLoading) {
    if (loginButton) {
        if (isLoading) {
            loginButton.disabled = true;
            loginButton.textContent = '로그인 중...';
            loginButton.style.opacity = '0.7';
        } else {
            loginButton.disabled = false;
            loginButton.textContent = '로그인';
            loginButton.style.opacity = '1';
        }
    }
    
    if (loginIdOrPhoneInput) {
        loginIdOrPhoneInput.disabled = isLoading;
    }
    if (passwordInput) {
        passwordInput.disabled = isLoading;
    }
}

// 필드 에러 표시 (로그인 전용)
function showLoginFieldError(field, message) {
    if (!field) return;
    
    removeLoginFieldError(field);
    
    field.classList.add('error');
    
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.style.cssText = `
        color: #ff5847;
        font-size: 12px;
        margin-top: 6px;
        animation: fadeIn 0.3s ease-out;
    `;
    errorElement.textContent = message;
    
    field.parentNode.appendChild(errorElement);
}

// 필드 에러 제거 (로그인 전용)
function removeLoginFieldError(field) {
    if (!field) return;
    
    field.classList.remove('error');
    
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// 모든 필드 에러 제거 (로그인 전용)
function removeAllLoginFieldErrors() {
    const loginModalElement = document.getElementById('loginModal');
    if (!loginModalElement) return;
    
    const allErrors = loginModalElement.querySelectorAll('.field-error');
    allErrors.forEach(error => error.remove());
    
    const allErrorFields = loginModalElement.querySelectorAll('.login-input.error');
    allErrorFields.forEach(field => field.classList.remove('error'));
}

// 키보드 이벤트 처리
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const loginModal = document.getElementById('loginModal');
        if (loginModal && loginModal.classList.contains('show')) {
            closeLoginModal();
        }
    }
});

// 모달 외부 클릭시 닫기
document.addEventListener('click', function(e) {
    const loginModal = document.getElementById('loginModal');
    if (loginModal && e.target === loginModal) {
        closeLoginModal();
    }
});

// 페이지 로드 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLogin);
} else {
    initializeLogin();
}