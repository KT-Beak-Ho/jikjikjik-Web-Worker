// 전역 변수
let currentStep = 1;

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 앱 초기화
function initializeApp() {
    // 실시간 업데이트 시작
    startJobUpdates();
    
    // 이벤트 리스너 등록
    setupEventListeners();
    
    // 페이지 로드 애니메이션
    setupPageAnimations();
    
    // 폼 유효성 검사 설정
    setupFormValidation();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 일자리 카드 클릭 이벤트
    document.querySelectorAll('.job-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.classList.contains('apply-now-btn')) {
                showNotification('상세 정보를 보려면 로그인하세요');
            }
        });
    });

    // 즉시 지원 버튼 클릭
    document.querySelectorAll('.apply-now-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            showLoginAlert();
        });
    });

    // 더보기 버튼 클릭
    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            showNotification('더 많은 일자리를 불러오는 중...');
            setTimeout(() => {
                addNewJobCards();
            }, 1000);
        });
    }

    // 로그인 폼 제출
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // 회원가입 폼 제출
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    // 모달 외부 클릭시 닫기
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }
}

// 페이지 애니메이션 설정
function setupPageAnimations() {
    // 카드 순차 애니메이션
    const cards = document.querySelectorAll('.job-card, .service-card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.animation = 'slideUpCards 0.5s ease-out';
        }, index * 100);
    });

    // 스크롤 기반 애니메이션
    setupScrollAnimations();
}

// 스크롤 애니메이션 설정
function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease-out';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.service-card, .stat-card').forEach(el => {
        observer.observe(el);
    });
}

// 실시간 일자리 업데이트
function startJobUpdates() {
    updateJobCards();
    setInterval(updateJobCards, 3000);
    setInterval(updateApplicantCount, 10000);
}

// 실시간 업데이트 시뮬레이션
function updateJobCards() {
    const updateTimeElement = document.getElementById('updateTime');
    const times = ['방금 전', '30초 전', '1분 전', '2분 전', '3분 전'];
    const randomTime = times[Math.floor(Math.random() * times.length)];
    
    if (updateTimeElement) {
        updateTimeElement.textContent = randomTime;
    }
}

// 지원자 수 업데이트
function updateApplicantCount() {
    const applicantInfos = document.querySelectorAll('.applicants-info');
    applicantInfos.forEach(info => {
        const text = info.textContent;
        const match = text.match(/지원자 (\d+)명/);
        if (match) {
            const currentCount = parseInt(match[1]);
            const newCount = currentCount + Math.floor(Math.random() * 3);
            info.textContent = text.replace(/지원자 \d+명/, `지원자 ${newCount}명`);
            
            // 업데이트 시 플래시 효과
            info.closest('.job-card').style.animation = 'flash 0.5s ease-out';
        }
    });
}

// 새로운 일자리 카드 추가
function addNewJobCards() {
    showNotification('새로운 일자리 54개가 추가되었습니다!');
    // 실제 구현에서는 API 호출로 새 데이터를 가져와 DOM에 추가
}

// 페이지 표시/숨김
function showPage(pageId) {
    // 모든 페이지 숨김
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 선택된 페이지 표시
    const targetPage = document.getElementById(pageId + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // 페이지별 초기화
    if (pageId === 'signup') {
        resetSignupForm();
    }
}

// 섹션 표시
function showSection(section) {
    if (section !== 'home') {
        showLoginAlert();
    }
}

// 스크롤 함수
function scrollToJobs() {
    const jobsSection = document.querySelector('.jobs-section');
    if (jobsSection) {
        jobsSection.scrollIntoView({ 
            behavior: 'smooth' 
        });
    }
}

// 로그인 알림 표시
function showLoginAlert() {
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.add('show');
    }
}

// 모달 닫기
function closeModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.remove('show');
    }
}

// 회원가입 모달
function showSignupModal() {
    closeModal();
    showPage('signup');
}

// 로그인 모달
function showLoginModal() {
    closeModal();
    showPage('login');
}

// 메뉴 표시
function showMenu() {
    const menuItems = [
        '🏠 홈',
        '🔨 일자리 찾기',
        '📋 이용 가이드',
        '💰 요금 안내',
        '📞 고객 센터',
        '⚙️ 설정'
    ];
    
    const menuText = menuItems.join('\n');
    showNotification(`메뉴:\n${menuText}`, 'info');
}

// 알림 표시
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 14px 28px;
        border-radius: 10px;
        font-size: 15px;
        font-weight: 500;
        z-index: 99999;
        animation: slideDown 0.3s ease-out;
        max-width: 90%;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    // 타입별 색상 설정
    if (type === 'success') {
        notification.style.background = 'rgba(0, 200, 150, 0.9)';
    } else if (type === 'error') {
        notification.style.background = 'rgba(255, 88, 71, 0.9)';
    } else if (type === 'warning') {
        notification.style.background = 'rgba(255, 184, 0, 0.9)';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 2500);
}

// 로그인 처리
function handleLogin(e) {
    e.preventDefault();
    
    const phone = e.target.querySelector('input[type="tel"]').value;
    const password = e.target.querySelector('input[type="password"]').value;
    
    if (!phone || !password) {
        showNotification('모든 필드를 입력해주세요.', 'error');
        return;
    }
    
    // 로딩 상태 표시
    const submitBtn = e.target.querySelector('.auth-button');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '로그인 중...';
    submitBtn.disabled = true;
    
    // 가상의 로그인 처리
    setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        showNotification('로그인 성공!', 'success');
        showPage('home');
    }, 1500);
}

// 회원가입 처리
function handleSignup(e) {
    e.preventDefault();
    
    if (currentStep < 3) {
        return;
    }
    
    // 필수 필드 검증
    const name = e.target.querySelector('input[name="name"]').value;
    const phone = e.target.querySelector('input[name="phone"]').value;
    const password = e.target.querySelector('input[name="password"]').value;
    const passwordConfirm = e.target.querySelector('input[name="passwordConfirm"]').value;
    const termsChecked = e.target.querySelector('#terms').checked;
    
    if (!name || !phone || !password || !passwordConfirm) {
        showNotification('모든 필수 필드를 입력해주세요.', 'error');
        return;
    }
    
    if (password !== passwordConfirm) {
        showNotification('비밀번호가 일치하지 않습니다.', 'error');
        return;
    }
    
    if (!termsChecked) {
        showNotification('이용약관에 동의해주세요.', 'error');
        return;
    }
    
    // 로딩 상태 표시
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '가입 중...';
    submitBtn.disabled = true;
    
    // 가상의 회원가입 처리
    setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        showNotification('회원가입이 완료되었습니다!', 'success');
        showPage('home');
    }, 2000);
}

// 회원가입 단계 이동
function nextStep() {
    if (currentStep >= 3) return;
    
    // 현재 단계 유효성 검사
    if (!validateCurrentStep()) {
        return;
    }
    
    // 현재 단계 숨김
    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.querySelectorAll('.step-dot')[currentStep - 1].classList.remove('active');
    document.querySelectorAll('.step-dot')[currentStep - 1].classList.add('completed');
    
    // 다음 단계 표시
    currentStep++;
    document.getElementById(`step${currentStep}`).classList.add('active');
    document.querySelectorAll('.step-dot')[currentStep - 1].classList.add('active');
}

function prevStep() {
    if (currentStep <= 1) return;
    
    // 현재 단계 숨김
    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.querySelectorAll('.step-dot')[currentStep - 1].classList.remove('active');
    
    // 이전 단계 표시
    currentStep--;
    document.getElementById(`step${currentStep}`).classList.add('active');
    document.querySelectorAll('.step-dot')[currentStep - 1].classList.remove('completed');
    document.querySelectorAll('.step-dot')[currentStep - 1].classList.add('active');
}

// 현재 단계 유효성 검사
function validateCurrentStep() {
    const currentStepElement = document.getElementById(`step${currentStep}`);
    
    if (currentStep === 1) {
        const requiredFields = currentStepElement.querySelectorAll('input[required], select[required]');
        for (let field of requiredFields) {
            if (!field.value.trim()) {
                showNotification('모든 필수 필드를 입력해주세요.', 'error');
                field.focus();
                return false;
            }
        }
    }
    
    if (currentStep === 2) {
        const skills = currentStepElement.querySelectorAll('input[name="skills"]:checked');
        const experience = currentStepElement.querySelector('input[name="experience"]:checked');
        
        if (skills.length === 0) {
            showNotification('최소 하나의 기술을 선택해주세요.', 'error');
            return false;
        }
        
        if (!experience) {
            showNotification('경험 수준을 선택해주세요.', 'error');
            return false;
        }
    }
    
    return true;
}

// 기술 선택 토글
function toggleSkill(element) {
    const checkbox = element.querySelector('.skill-checkbox');
    checkbox.checked = !checkbox.checked;
    
    if (checkbox.checked) {
        element.classList.add('selected');
    } else {
        element.classList.remove('selected');
    }
}

// 경험 선택
function selectExperience(element) {
    // 모든 경험 항목에서 선택 해제
    document.querySelectorAll('.experience-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // 선택된 항목 활성화
    element.classList.add('selected');
    const radio = element.querySelector('.experience-radio');
    radio.checked = true;
}

// 회원가입 폼 리셋
function resetSignupForm() {
    currentStep = 1;
    
    // 모든 단계 숨김
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // 첫 번째 단계 표시
    document.getElementById('step1').classList.add('active');
    
    // 단계 인디케이터 리셋
    document.querySelectorAll('.step-dot').forEach((dot, index) => {
        dot.classList.remove('active', 'completed');
        if (index === 0) {
            dot.classList.add('active');
        }
    });
    
    // 폼 초기화
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.reset();
    }
    
    // 선택된 기술/경험 초기화
    document.querySelectorAll('.skill-item, .experience-item').forEach(item => {
        item.classList.remove('selected');
    });
}

// 폼 유효성 검사 설정
function setupFormValidation() {
    // 실시간 유효성 검사
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                validateField(this);
            }
        });
    });
}

// 필드 유효성 검사
function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // 필수 필드 검사
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = '필수 입력 항목입니다.';
    }
    
    // 전화번호 형식 검사
    if (field.type === 'tel' && value) {
        const phoneRegex = /^010-\d{4}-\d{4}$/;
        if (!phoneRegex.test(value)) {
            isValid = false;
            errorMessage = '올바른 전화번호 형식이 아닙니다.';
        }
    }
    
    // 비밀번호 길이 검사
    if (field.type === 'password' && value && value.length < 8) {
        isValid = false;
        errorMessage = '비밀번호는 8자 이상이어야 합니다.';
    }
    
    // 결과 표시
    if (isValid) {
        field.classList.remove('error');
        removeFieldError(field);
    } else {
        field.classList.add('error');
        showFieldError(field, errorMessage);
    }
    
    return isValid;
}

// 필드 에러 표시
function showFieldError(field, message) {
    removeFieldError(field);
    
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.style.cssText = `
        color: var(--danger);
        font-size: 12px;
        margin-top: 4px;
        animation: fadeIn 0.3s ease-out;
    `;
    errorElement.textContent = message;
    
    field.parentNode.appendChild(errorElement);
}

// 필드 에러 제거
function removeFieldError(field) {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// 키보드 이벤트 처리
document.addEventListener('keydown', function(e) {
    // ESC 키로 모달 닫기
    if (e.key === 'Escape') {
        closeModal();
    }
    
    // Enter 키로 다음 단계 (회원가입 폼에서)
    if (e.key === 'Enter' && document.getElementById('signupPage').classList.contains('active')) {
        if (currentStep < 3) {
            e.preventDefault();
            nextStep();
        }
    }
});

// 터치 이벤트 개선 (모바일)
document.addEventListener('touchstart', function() {}, { passive: true });

// 페이지 가시성 변경 시 처리
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        // 페이지가 다시 보일 때 데이터 새로고침
        updateJobCards();
    }
});

// 온라인/오프라인 상태 처리
window.addEventListener('online', function() {
    showNotification('인터넷 연결이 복구되었습니다.', 'success');
});

window.addEventListener('offline', function() {
    showNotification('인터넷 연결을 확인해주세요.', 'warning');
});

// 성능 최적화를 위한 디바운스 함수
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 스크롤 이벤트 최적화
const debouncedScrollHandler = debounce(function() {
    // 스크롤 기반 기능들
}, 100);

window.addEventListener('scroll', debouncedScrollHandler);

// 리사이즈 이벤트 최적화
const debouncedResizeHandler = debounce(function() {
    // 화면 크기 변경 시 레이아웃 조정
}, 250);

window.addEventListener('resize', debouncedResizeHandler);