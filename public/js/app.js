// ============================================
// APP.JS - 메인 애플리케이션 로직
// ============================================

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    initializeEventListeners();
});

// 로그인 상태 확인
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (isLoggedIn) {
        showPage('dashboard');
        updateNavigation('home');
    } else {
        showPage('home');
        updateNavigation('home');
    }
}

// 페이지 전환
function showPage(pageName) {
    // 모든 페이지 숨기기
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    // 선택한 페이지 표시
    let pageToShow;
    if (pageName === 'home') {
        pageToShow = document.getElementById('homePage');
    } else if (pageName === 'dashboard') {
        pageToShow = document.getElementById('dashboardPage');
    } else if (pageName === 'signup') {
        pageToShow = document.getElementById('signupPage');
    }
    
    if (pageToShow) {
        pageToShow.classList.add('active');
    }
}

// 네비게이션 클릭 처리
function handleNavClick(section) {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn && section !== 'home') {
        showLoginAlert();
        return;
    }
    
    updateNavigation(section);
    
    // 섹션별 처리 (추후 구현)
    switch(section) {
        case 'home':
            if (isLoggedIn) {
                showPage('dashboard');
            } else {
                showPage('home');
            }
            break;
        case 'jobs':
            showNotification('일자리 찾기 페이지로 이동합니다.');
            break;
        case 'schedule':
            showNotification('내 일정 페이지로 이동합니다.');
            break;
        case 'income':
            showNotification('수입 관리 페이지로 이동합니다.');
            break;
        case 'profile':
            showNotification('내 정보 페이지로 이동합니다.');
            break;
    }
}

// 네비게이션 활성화 상태 업데이트
function updateNavigation(section) {
    const navItems = document.querySelectorAll('.side-nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    const sectionMap = {
        'home': 0,
        'jobs': 1,
        'schedule': 2,
        'income': 3,
        'profile': 4
    };
    
    const index = sectionMap[section];
    if (index !== undefined && navItems[index]) {
        navItems[index].classList.add('active');
    }
}

// 로그아웃 처리
function handleLogout() {
    if (!confirm('로그아웃 하시겠습니까?')) {
        return;
    }
    
    // 로컬 스토리지 정리
    localStorage.removeItem('memberId');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    localStorage.removeItem('isLoggedIn');
    
    showNotification('로그아웃되었습니다.', 'success');
    
    // 홈 페이지로 이동
    setTimeout(() => {
        showPage('home');
        updateNavigation('home');
    }, 500);
}

// 로그인 알림 모달 표시
function showLoginAlert() {
    const modal = document.getElementById('modalOverlay');
    if (modal) {
        modal.classList.add('show');
    }
}

// 모달 닫기
function closeModal() {
    const modal = document.getElementById('modalOverlay');
    if (modal) {
        modal.classList.remove('show');
    }
}

// 스카우트 기능 토글
let scoutEnabled = false;

function toggleScout() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        showLoginAlert();
        return;
    }
    
    scoutEnabled = !scoutEnabled;
    const card = document.getElementById('scoutCard');
    const statusElement = document.getElementById('scoutStatus');
    
    if (card && statusElement) {
        if (scoutEnabled) {
            card.classList.add('active');
            statusElement.textContent = 'ON';
            showNotification('스카우트 기능이 켜졌습니다! 기업들이 회원님을 찾을 수 있어요.', 'success');
        } else {
            card.classList.remove('active');
            statusElement.textContent = 'OFF';
            showNotification('스카우트 기능이 꺼졌습니다.', 'info');
        }
    }
}

// 회원가입 모달 표시
function showSignupModal() {
    showPage('signup');
}

// 알림 표시
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    // 타입별 아이콘
    let icon = 'ℹ️';
    let bgColor = 'rgba(0, 0, 0, 0.8)';
    
    if (type === 'success') {
        icon = '✅';
        bgColor = 'rgba(0, 200, 150, 0.9)';
    } else if (type === 'error') {
        icon = '❌';
        bgColor = 'rgba(255, 88, 71, 0.9)';
    } else if (type === 'warning') {
        icon = '⚠️';
        bgColor = 'rgba(255, 184, 0, 0.9)';
    }
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${bgColor};
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: slideDown 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 8px;
        max-width: 90%;
    `;
    
    notification.innerHTML = `<span style="font-size: 16px;">${icon}</span> ${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// 일자리로 스크롤
function scrollToJobs() {
    const jobsSection = document.querySelector('.jobs-section');
    if (jobsSection) {
        jobsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// 회원가입 모달 표시
function showSignupModal() {
    showPage('signup');
}

// 이벤트 리스너 초기화
function initializeEventListeners() {
    
    // 액션 버튼 클릭
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('action-btn')) {
            e.stopPropagation();
            const action = e.target.textContent;
            
            if (action.includes('전화')) {
                showNotification('현장 담당자에게 전화 연결', 'info');
            } else if (action.includes('길찾기')) {
                showNotification('네이버 지도로 이동', 'info');
            } else if (action.includes('QR')) {
                showNotification('QR 체크인 화면으로 이동', 'info');
            }
        }
    });
    
    // 일자리 카드 클릭
    document.addEventListener('click', function(e) {
        if (e.target.closest('.job-card') && !e.target.classList.contains('action-btn') && !e.target.classList.contains('apply-now-btn')) {
            showNotification('일자리 상세 페이지로 이동합니다.', 'info');
        }
    });
    
    // 지원 버튼 클릭
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('apply-now-btn')) {
            e.stopPropagation();
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            
            if (!isLoggedIn) {
                showLoginAlert();
            } else {
                showNotification('일자리 지원이 완료되었습니다!', 'success');
            }
        }
    });
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translate(-50%, -20px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);