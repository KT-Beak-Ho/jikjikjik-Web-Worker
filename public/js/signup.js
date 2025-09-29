// ============================================
// SIGNUP.JS - 회원가입 관련 기능
// ============================================

// API 설정 클래스
class SignupApiConfig {
    constructor() {
        this.baseUrl = this.getApiUrl();
        this.PHONE_VALIDATION_ENDPOINT = '/join/validation-phone';
        this.SMS_VERIFICATION_ENDPOINT = '/join/sms-verification';
        this.WORKER_JOIN_ENDPOINT = '/join/worker/join';
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

    setBaseUrl(url) {
        this.baseUrl = url;
        console.log('Base URL 업데이트됨:', url);
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
                return null;
            }
        } catch (error) {
            console.warn('환경변수 로드 중 오류:', error.message);
            return null;
        }
    }

    getPhoneValidationUrl() {
        return this.baseUrl + this.PHONE_VALIDATION_ENDPOINT;
    }

    getSmsVerificationUrl() {
        return this.baseUrl + this.SMS_VERIFICATION_ENDPOINT;
    }

    getWorkerJoinUrl() {
        return this.baseUrl + this.WORKER_JOIN_ENDPOINT;
    }
}

// API 설정 인스턴스 생성
const signupApiConfig = new SignupApiConfig();

// 회원가입 단계 관리 변수
let currentStep = 1;
let verificationTimer = null;
let remainingTime = 180; // 3분 = 180초
let isPhoneVerified = false;

// 인증번호 관리 변수
let currentAuthCode = null; // 서버에서 받은 실제 인증번호

// 경력 및 자격증 관리 변수
let experienceList = [];
let certificatesList = [];

// ============================================
// 단계 관리 함수들
// ============================================

// 다음 단계로 이동
function nextStep() {
    // 1단계(전화번호 인증)에서는 인증 완료 여부 확인
    if (currentStep === 1 && !isPhoneVerified) {
        showVerificationStatus('전화번호 인증을 완료해주세요.', 'error');
        return;
    }

    // 현재 단계 유효성 검사
    if (!validateCurrentStep()) {
        return;
    }

    const steps = document.querySelectorAll('.form-step');
    const dots = document.querySelectorAll('.step-dot');

    if (currentStep < steps.length) {
        steps[currentStep - 1].classList.remove('active');
        steps[currentStep].classList.add('active');

        dots[currentStep - 1].classList.add('completed');
        if (currentStep < dots.length) {
            dots[currentStep].classList.add('active');
        }

        currentStep++;
    }
}

// 이전 단계로 이동
function prevStep() {
    const steps = document.querySelectorAll('.form-step');
    const dots = document.querySelectorAll('.step-dot');

    if (currentStep > 1) {
        steps[currentStep - 1].classList.remove('active');
        steps[currentStep - 2].classList.add('active');

        if (currentStep <= dots.length) {
            dots[currentStep - 1].classList.remove('active');
        }
        if (currentStep - 2 < dots.length) {
            dots[currentStep - 2].classList.remove('completed');
        }

        currentStep--;
    }
}

// ============================================
// 유효성 검사 함수
// ============================================

// 이메일 유효성 검사
function validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

// 이메일 실시간 검증 및 메시지 표시
function showEmailValidation(email, isValid) {
    const messageElement = document.getElementById('emailValidationMessage');

    if (!email) {
        messageElement.style.display = 'none';
        return;
    }

    if (isValid) {
        messageElement.textContent = '올바른 이메일 형식입니다.';
        messageElement.className = 'validation-message success';
        messageElement.style.display = 'block';
    } else {
        messageElement.textContent = '올바른 이메일 형식을 입력해주세요.';
        messageElement.className = 'validation-message error';
        messageElement.style.display = 'block';
    }
}

// 현재 단계 유효성 검사
function validateCurrentStep() {
    const currentStepElement = document.querySelector(`#step${currentStep}`);
    if (!currentStepElement) return true;

    const requiredInputs = currentStepElement.querySelectorAll('input[required], select[required]');

    for (let input of requiredInputs) {
        if (!input.value.trim()) {
            input.focus();
            showNotification('필수 항목을 모두 입력해주세요.', 'error');
            return false;
        }
    }

    // 2단계 국적 선택 검증
    if (currentStep === 2) {
        const selectedNationality = currentStepElement.querySelector('input[name="nationality"]:checked');
        if (!selectedNationality) {
            showNotification('국적을 선택해주세요.', 'error');
            return false;
        }
    }

    // 4단계 기술 선택 검증
    if (currentStep === 4) {
        const selectedSkills = currentStepElement.querySelectorAll('input[name="skills"]:checked');
        if (selectedSkills.length === 0) {
            showNotification('최소 하나 이상의 기술을 선택해주세요.', 'error');
            return false;
        }
    }

    // 5단계 은행 정보 검증
    if (currentStep === 5) {
        const accountNumber = currentStepElement.querySelector('input[name="accountNumber"]').value;
        const accountHolder = currentStepElement.querySelector('input[name="accountHolder"]').value;

        // 계좌번호 숫자만 확인
        if (!/^\d+$/.test(accountNumber)) {
            showNotification('계좌번호는 숫자만 입력해주세요.', 'error');
            return false;
        }

        // 예금주명 확인
        if (accountHolder.trim().length < 2) {
            showNotification('예금주명을 정확히 입력해주세요.', 'error');
            return false;
        }
    }

    // 7단계 계정 설정 및 동의
    if (currentStep === 7) {
        const email = currentStepElement.querySelector('input[name="email"]').value;
        const password = currentStepElement.querySelector('input[name="password"]').value;
        const passwordConfirm = currentStepElement.querySelector('input[name="passwordConfirm"]').value;

        // 이메일 유효성 검사
        if (!validateEmail(email)) {
            showNotification('올바른 이메일 형식을 입력해주세요.', 'error');
            return false;
        }

        if (password.length < 8) {
            showNotification('비밀번호는 8자 이상이어야 합니다.', 'error');
            return false;
        }

        if (password !== passwordConfirm) {
            showNotification('비밀번호가 일치하지 않습니다.', 'error');
            return false;
        }

        const termsCheckbox = currentStepElement.querySelector('#terms');
        if (!termsCheckbox.checked) {
            showNotification('이용약관에 동의해주세요.', 'error');
            return false;
        }
    }

    return true;
}

// ============================================
// 전화번호 인증 관련 함수들
// ============================================

// 전화번호 중복 체크 API 호출
/**
 * 전화번호 중복 체크 API
 *
 * Request: {
 *   "phone": "01012345678"
 * }
 *
 * Success Response (중복 아님): {
 *   "data": null,
 *   "message": "성공"
 * }
 *
 * Error Response (중복): {
 *   "data": {
 *     "status": "CONFLICT",
 *     "code": "MEMBER-005",
 *     "errorMessage": "이미 등록된 핸드폰 번호입니다."
 *   },
 *   "message": "커스텀 예외 반환"
 * }
 */
async function checkPhoneDuplicate(phoneNumber) {
    try {
        const cleanPhone = phoneNumber.replace(/-/g, ''); // 하이픈 제거

        const url = signupApiConfig.getPhoneValidationUrl();
        console.log('전화번호 중복 체크 API 호출:', url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone: cleanPhone
            })
        });

        const result = await response.json();
        console.log('전화번호 중복 체크 응답:', result);

        // 응답 처리
        if (response.ok) {
            // 성공 응답: data가 null이면 중복이 아님
            return {
                isDuplicate: false,
                message: result.message || '사용 가능한 전화번호입니다.'
            };
        } else {
            // 오류 응답 처리
            if (result.data && result.data.status === 'CONFLICT') {
                // 중복 전화번호
                return {
                    isDuplicate: true,
                    message: result.data.errorMessage || '이미 등록된 핸드폰 번호입니다.',
                    code: result.data.code
                };
            } else {
                // 기타 서버 오류
                let errorMessage = '서버 오류가 발생했습니다.';

                if (response.status === 400) {
                    errorMessage = '잘못된 전화번호 형식입니다.';
                } else if (response.status === 500) {
                    errorMessage = '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
                } else if (response.status === 429) {
                    errorMessage = '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.';
                } else if (result.data && result.data.errorMessage) {
                    errorMessage = result.data.errorMessage;
                }

                throw new Error(errorMessage);
            }
        }
    } catch (error) {
        console.error('전화번호 중복 체크 오류:', error);

        // 네트워크 오류 처리
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('네트워크 연결을 확인해주세요.');
        }

        // JSON 파싱 오류 처리
        if (error.name === 'SyntaxError') {
            throw new Error('서버 응답을 처리할 수 없습니다.');
        }

        throw error;
    }
}

// 인증번호 발송 API 호출
/**
 * 인증번호 발송 API
 *
 * Request: {
 *   "phone": "01012345678"
 * }
 *
 * Response: {
 *   "data": {
 *     "authCode": "008064"
 *   },
 *   "message": "6자리 인증 코드 반환"
 * }
 */
async function sendSmsVerificationCode(phoneNumber) {
    try {
        const cleanPhone = phoneNumber.replace(/-/g, ''); // 하이픈 제거

        const url = signupApiConfig.getSmsVerificationUrl();
        console.log('인증번호 발송 API 호출:', url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone: cleanPhone
            })
        });

        const result = await response.json();
        console.log('인증번호 발송 응답:', result);

        if (!response.ok) {
            // 오류 응답 처리
            let errorMessage = '인증번호 발송에 실패했습니다.';

            if (response.status === 400) {
                errorMessage = '잘못된 전화번호 형식입니다.';
            } else if (response.status === 429) {
                errorMessage = '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.';
            } else if (response.status === 500) {
                errorMessage = '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
            } else if (result.data && result.data.errorMessage) {
                errorMessage = result.data.errorMessage;
            }

            throw new Error(errorMessage);
        }

        // 성공 응답 검증
        if (!result.data || !result.data.authCode) {
            throw new Error('서버 응답 형식이 올바르지 않습니다.');
        }

        currentAuthCode = result.data.authCode;

        return {
            success: true,
            authCode: result.data.authCode,
            message: result.message || '인증번호가 발송되었습니다.'
        };

    } catch (error) {
        console.error('인증번호 발송 오류:', error);

        // 네트워크 오류 처리
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('네트워크 연결을 확인해주세요.');
        }

        // JSON 파싱 오류 처리
        if (error.name === 'SyntaxError') {
            throw new Error('서버 응답을 처리할 수 없습니다.');
        }

        throw error;
    }
}

// 인증번호 발송
async function sendVerificationCode() {
    const phoneInput = document.getElementById('phoneNumber');
    const phoneNumber = phoneInput.value.trim();

    // 전화번호 형식 검증
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(phoneNumber)) {
        showVerificationStatus('올바른 전화번호 형식을 입력해주세요. (010-0000-0000)', 'error');
        phoneInput.focus();
        return;
    }

    // 발송 버튼 비활성화 및 로딩 상태
    const sendBtn = document.querySelector('.verification-send-btn');
    sendBtn.disabled = true;
    sendBtn.textContent = '확인 중...';

    try {
        // 전화번호 중복 체크
        showVerificationStatus('전화번호 중복을 확인하고 있습니다...', 'info');

        const duplicateResult = await checkPhoneDuplicate(phoneNumber);

        if (duplicateResult.isDuplicate) {
            const message = duplicateResult.message || '이미 가입된 전화번호입니다. 다른 번호를 사용해주세요.';
            showVerificationStatus(message, 'error');
            sendBtn.disabled = false;
            sendBtn.textContent = '인증번호 발송';
            phoneInput.focus(); // 전화번호 입력 필드에 포커스
            return;
        }

        // 중복이 아닌 경우 인증번호 발송
        showVerificationStatus('인증번호를 발송하고 있습니다...', 'info');

        try {
            const smsResult = await sendSmsVerificationCode(phoneNumber);

            showVerificationStatus('인증번호를 발송했습니다. SMS를 확인해주세요.', 'info');

            // 인증번호 입력 필드 표시
            const verificationCodeGroup = document.getElementById('verificationCodeGroup');
            verificationCodeGroup.style.display = 'block';

            // 발송 버튼 상태 변경
            sendBtn.textContent = '발송완료';

            // 타이머 시작
            startVerificationTimer();

            // 재발송 버튼 활성화 (30초 후)
            setTimeout(() => {
                const resendBtn = document.getElementById('resendBtn');
                resendBtn.disabled = false;
            }, 30000);

        } catch (smsError) {
            // 인증번호 발송 실패
            console.error('인증번호 발송 실패:', smsError);
            showVerificationStatus(smsError.message || '인증번호 발송에 실패했습니다. 다시 시도해주세요.', 'error');

            // 버튼 상태 복원
            sendBtn.disabled = false;
            sendBtn.textContent = '인증번호 발송';
            return;
        }

    } catch (error) {
        // API 오류 처리
        console.error('전화번호 확인 중 오류:', error);
        showVerificationStatus('전화번호 확인 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');

        // 버튼 상태 복원
        sendBtn.disabled = false;
        sendBtn.textContent = '인증번호 발송';
    }
}

// 인증 타이머 시작
function startVerificationTimer() {
    remainingTime = 180; // 3분
    const timerElement = document.getElementById('verificationTimer');

    verificationTimer = setInterval(() => {
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        remainingTime--;

        if (remainingTime < 0) {
            clearInterval(verificationTimer);
            showVerificationStatus('인증시간이 만료되었습니다. 다시 시도해주세요.', 'error');
            resetVerificationForm();
        }
    }, 1000);
}

// 인증번호 재발송
async function resendVerificationCode() {
    clearInterval(verificationTimer);

    const phoneInput = document.getElementById('phoneNumber');
    const phoneNumber = phoneInput.value.trim();
    const resendBtn = document.getElementById('resendBtn');

    // 재발송 버튼 비활성화 및 로딩 상태
    resendBtn.disabled = true;
    resendBtn.textContent = '확인 중...';

    try {
        // 전화번호 중복 재확인
        showVerificationStatus('전화번호를 다시 확인하고 있습니다...', 'info');

        const duplicateResult = await checkPhoneDuplicate(phoneNumber);

        if (duplicateResult.isDuplicate) {
            const message = duplicateResult.message || '이미 가입된 전화번호입니다. 다른 번호를 사용해주세요.';
            showVerificationStatus(message, 'error');
            resendBtn.textContent = '인증번호 재발송';
            resetVerificationForm();
            phoneInput.focus(); // 전화번호 입력 필드에 포커스
            return;
        }

        // 새로운 인증번호 발송
        showVerificationStatus('새로운 인증번호를 발송하고 있습니다...', 'info');

        try {
            const smsResult = await sendSmsVerificationCode(phoneNumber);

            // 개발 모드에서만 콘솔에 인증번호 표시 (실제 운영에서는 제거)
            if (process?.env?.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
                console.log('🔐 개발용 재발송 인증번호:', smsResult.authCode);
            }

            showVerificationStatus('새로운 인증번호를 발송했습니다. SMS를 확인해주세요.', 'info');

            // 타이머 재시작
            startVerificationTimer();

            // 재발송 버튼 상태 변경
            resendBtn.textContent = '인증번호 재발송';

            setTimeout(() => {
                resendBtn.disabled = false;
            }, 30000);

            // 입력 필드 초기화
            document.getElementById('verificationCode').value = '';

        } catch (smsError) {
            // 인증번호 재발송 실패
            console.error('인증번호 재발송 실패:', smsError);
            showVerificationStatus(smsError.message || '인증번호 재발송에 실패했습니다. 다시 시도해주세요.', 'error');

            // 버튼 상태 복원
            resendBtn.disabled = false;
            resendBtn.textContent = '인증번호 재발송';
            return;
        }

    } catch (error) {
        // API 오류 처리
        console.error('전화번호 재확인 중 오류:', error);
        showVerificationStatus('전화번호 확인 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');

        // 버튼 상태 복원
        resendBtn.disabled = false;
        resendBtn.textContent = '인증번호 재발송';
    }
}

// 전화번호 인증 확인
function verifyPhoneNumber() {
    const verificationCode = document.getElementById('verificationCode').value.trim();

    if (verificationCode.length !== 6) {
        showVerificationStatus('6자리 인증번호를 입력해주세요.', 'error');
        return;
    }

    // TODO: 향후 서버 API로 인증번호 검증 구현 예정
    // 현재는 임시로 클라이언트에서 검증 (개발 환경에서만)

    // 임시 검증 로직 (실제 운영에서는 서버 API 호출로 대체)
    if (verificationCode === currentAuthCode && verificationCode.length === 6) {
        isPhoneVerified = true;
        clearInterval(verificationTimer);
        showVerificationStatus('휴대폰 인증이 완료되었습니다! ✅', 'success');

        // 다음 단계 버튼 활성화
        const nextBtn = document.getElementById('phoneVerifyBtn');
        nextBtn.disabled = false;
        nextBtn.textContent = '다음 단계';
        nextBtn.onclick = nextStep;

    } else {
        showVerificationStatus('인증번호가 올바르지 않습니다. 다시 확인해주세요.', 'error');
    }
}

// 인증 폼 초기화
function resetVerificationForm() {
    const verificationCodeGroup = document.getElementById('verificationCodeGroup');
    verificationCodeGroup.style.display = 'none';

    const sendBtn = document.querySelector('.verification-send-btn');
    sendBtn.disabled = false;
    sendBtn.textContent = '인증번호 발송';

    const resendBtn = document.getElementById('resendBtn');
    resendBtn.disabled = true;

    document.getElementById('verificationCode').value = '';
    isPhoneVerified = false;

    const nextBtn = document.getElementById('phoneVerifyBtn');
    nextBtn.disabled = true;
    nextBtn.textContent = '인증 완료 후 다음';
}

// 인증 상태 표시
function showVerificationStatus(message, type) {
    const statusElement = document.getElementById('verificationStatus');
    statusElement.className = `verification-status ${type}`;
    statusElement.textContent = message;
    statusElement.style.display = 'block';

    if (type === 'success') {
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 3000);
    }
}

// ============================================
// 선택 관련 함수들
// ============================================

// 국적 선택
function selectNationality(element) {
    const radio = element.querySelector('.nationality-radio');
    radio.checked = true;

    document.querySelectorAll('.nationality-item').forEach(item => {
        item.classList.remove('selected');
    });
    element.classList.add('selected');
}

// 직종 선택 토글
function toggleSkill(element) {
    const checkbox = element.querySelector('.skill-checkbox');
    checkbox.checked = !checkbox.checked;

    if (checkbox.checked) {
        element.classList.add('selected');
    } else {
        element.classList.remove('selected');
    }

    // 경력 섹션 표시/숨김 및 모달 옵션 업데이트
    updateExperienceSection();
}

// 경험 레벨 선택
function selectExperience(element) {
    const radio = element.querySelector('.experience-radio');
    radio.checked = true;

    document.querySelectorAll('.experience-item').forEach(item => {
        item.classList.remove('selected');
    });
    element.classList.add('selected');
}

// ============================================
// 경력 관리 함수들
// ============================================

// 경력 섹션 업데이트
function updateExperienceSection() {
    const selectedSkills = document.querySelectorAll('input[name="skills"]:checked');
    const experienceSection = document.getElementById('experienceSection');

    if (selectedSkills.length > 0) {
        experienceSection.style.display = 'block';
        updateExperienceModalOptions();
    } else {
        experienceSection.style.display = 'none';
    }
}

// 경력 추가 모달의 직종 옵션 업데이트
function updateExperienceModalOptions() {
    const selectedSkills = document.querySelectorAll('input[name="skills"]:checked');
    const experienceSkillSelect = document.getElementById('experienceSkill');

    // 기존 옵션 제거 (첫 번째 옵션 제외)
    while (experienceSkillSelect.children.length > 1) {
        experienceSkillSelect.removeChild(experienceSkillSelect.lastChild);
    }

    // 선택된 기술들을 옵션으로 추가
    const skillNames = {
        'concrete': '콘크리트공',
        'rebar': '철근공',
        'carpenter': '목수',
        'electric': '전기공',
        'plumber': '배관공',
        'tile': '타일공',
        'painter': '도장공',
        'general': '일반인부'
    };

    selectedSkills.forEach(skill => {
        const option = document.createElement('option');
        option.value = skill.value;
        option.textContent = skillNames[skill.value];
        experienceSkillSelect.appendChild(option);
    });
}

// 직종별 경력 추가 (직종 선택 시 바로 모달 열기)
function addSkillExperience(skillValue, event) {
    event.stopPropagation(); // 부모 클릭 이벤트 방지

    // 해당 직종을 자동으로 체크
    const skillCheckbox = document.querySelector(`input[value="${skillValue}"]`);
    if (skillCheckbox && !skillCheckbox.checked) {
        skillCheckbox.checked = true;
        skillCheckbox.closest('.skill-item').classList.add('selected');
        updateExperienceSection();
    }

    // 모달 열고 해당 직종 선택
    showAddExperienceModal(skillValue);
}

// 경력 추가 모달 표시
function showAddExperienceModal(preSelectedSkill = null) {
    const modal = document.getElementById('experienceModal');
    if (modal) {
        modal.classList.add('show');
        updateExperienceModalOptions();

        // 특정 직종이 미리 선택된 경우
        if (preSelectedSkill) {
            const experienceSkillSelect = document.getElementById('experienceSkill');
            experienceSkillSelect.value = preSelectedSkill;
        }
    }
}

// 경력 추가 모달 닫기
function closeExperienceModal() {
    const modal = document.getElementById('experienceModal');
    if (modal) {
        modal.classList.remove('show');
        // 폼 초기화
        document.getElementById('experienceForm').reset();
    }
}

// 경력 년수 텍스트 가져오기
function getExperienceYearsText(yearsValue) {
    const yearsOptions = {
        '1': '1년 미만',
        '2': '1년 이상 ~ 2년 미만',
        '3': '2년 이상 ~ 3년 미만',
        '4': '3년 이상 ~ 4년 미만',
        '5': '4년 이상 ~ 5년 미만',
        '6': '5년 이상 ~ 7년 미만',
        '8': '7년 이상 ~ 10년 미만',
        '11': '10년 이상 ~ 15년 미만',
        '16': '15년 이상 ~ 20년 미만',
        '21': '20년 이상'
    };
    return yearsOptions[yearsValue] || '';
}

// 경력 추가
function addExperience(experienceData) {
    const skillNames = {
        'concrete': '콘크리트공',
        'rebar': '철근공',
        'carpenter': '목수',
        'electric': '전기공',
        'plumber': '배관공',
        'tile': '타일공',
        'painter': '도장공',
        'general': '일반인부'
    };

    const experience = {
        id: Date.now(),
        skill: experienceData.skill,
        skillName: skillNames[experienceData.skill],
        years: experienceData.years,
        yearsText: getExperienceYearsText(experienceData.years)
    };

    experienceList.push(experience);
    renderExperienceList();
}

// 경력 목록 렌더링
function renderExperienceList() {
    const experienceListContainer = document.getElementById('experienceList');
    experienceListContainer.innerHTML = '';

    experienceList.forEach(experience => {
        const experienceCard = document.createElement('div');
        experienceCard.className = 'experience-item-card';

        experienceCard.innerHTML = `
            <div class="experience-header">
                <span class="experience-skill-tag">${experience.skillName}</span>
                <button class="experience-delete-btn" onclick="removeExperience(${experience.id})">×</button>
            </div>
            <div class="experience-years">경력: ${experience.yearsText}</div>
        `;

        experienceListContainer.appendChild(experienceCard);
    });
}

// 경력 삭제
function removeExperience(id) {
    if (confirm('이 경력을 삭제하시겠습니까?')) {
        experienceList = experienceList.filter(exp => exp.id !== id);
        renderExperienceList();
    }
}

// ============================================
// 자격증 관리 함수들
// ============================================

// 자격증 추가
function addCertificate() {
    const certificateName = prompt('자격증명을 입력하세요:');
    if (certificateName && certificateName.trim()) {
        const certificate = {
            id: Date.now(),
            name: certificateName.trim()
        };
        certificatesList.push(certificate);
        renderCertificatesList();
    }
}

// 자격증 목록 렌더링
function renderCertificatesList() {
    const certificatesListContainer = document.getElementById('certificatesList');
    certificatesListContainer.innerHTML = '';

    certificatesList.forEach(certificate => {
        const certificateItem = document.createElement('div');
        certificateItem.className = 'certificate-item';

        certificateItem.innerHTML = `
            <span class="certificate-name">${certificate.name}</span>
            <button class="certificate-delete-btn" onclick="removeCertificate(${certificate.id})">×</button>
        `;

        certificatesListContainer.appendChild(certificateItem);
    });
}

// 자격증 삭제
function removeCertificate(id) {
    if (confirm('이 자격증을 삭제하시겠습니까?')) {
        certificatesList = certificatesList.filter(cert => cert.id !== id);
        renderCertificatesList();
    }
}

// ============================================
// 회원가입 제출 관련 함수들
// ============================================

// 회원가입 폼 데이터 수집
function collectSignupFormData() {
    // 전화번호 (로그인 ID로 사용)
    const phoneNumberInput = document.getElementById('phoneNumber');
    const phoneNumber = phoneNumberInput ? phoneNumberInput.value.replace(/-/g, '') : '';

    // 이메일
    const emailInput = document.querySelector('input[name="email"]');
    const email = emailInput ? emailInput.value : '';

    // 비밀번호
    const passwordInput = document.querySelector('input[name="password"]');
    const password = passwordInput ? passwordInput.value : '';

    // 개인정보
    const workerNameInput = document.querySelector('input[name="workerName"]') ||
                           document.querySelector('input[name="name"]');
    const workerName = workerNameInput ? workerNameInput.value : '홍길동';

    const birthInput = document.querySelector('input[name="birthDate"]') ||
                      document.querySelector('input[name="birth"]');
    const birth = birthInput ? birthInput.value : '19750101';

    const genderInput = document.querySelector('input[name="gender"]:checked');
    const gender = genderInput ? genderInput.value.toUpperCase() : 'MALE';

    // 국적
    const nationalityInput = document.querySelector('input[name="nationality"]:checked');
    const nationality = nationalityInput ? nationalityInput.value.toUpperCase() : 'KOREAN';

    // 은행 정보
    const bankInput = document.querySelector('select[name="bankName"]');
    const bank = bankInput ? bankInput.value : '국민은행';

    const accountInput = document.querySelector('input[name="accountNumber"]');
    const account = accountInput ? accountInput.value : '12341234123412';

    const accountHolderInput = document.querySelector('input[name="accountHolder"]');
    const accountHolder = accountHolderInput ? accountHolderInput.value : (workerName || '홍길동');

    // 주소 정보
    const addressInput = document.querySelector('input[name="address"]');
    const address = addressInput ? addressInput.value : '부산광역시 사하구 낙동대로 550번길 37';
    const latitude = 35.116777388697734; // 임시값
    const longitude = 128.9685393114043; // 임시값

    // 경력 정보 - 기술명을 API 형식으로 매핑
    const techMapping = {
        '보통인부': 'NORMAL',
        '작업반장': 'FOREMAN',
        '특별인부': 'SKILLED_LABORER',
        '조력공': 'HELPER',
        '비계공': 'SCAFFOLDER',
        '형틀목공': 'FORMWORK_CARPENTER',
        '철근공': 'REBAR_WORKER',
        '철골공': 'STEEL_STRUCTURE',
        '용접공': 'WELDER',
        '콘크리트공': 'CONCRETE_WORKER',
        '조적공': 'BRICKLAYER',
        '견출공': 'DRYWALL_FINISHER',
        '건축목공': 'CONSTRUCTION_CARPENTER',
        '창호공': 'WINDOW_DOOR_INSTALLER',
        '유리공': 'GLAZIER',
        '방수공': 'WATERPROOFING_WORKER',
        '미장공': 'PLASTERER',
        '타일공': 'TILE',
        '도장공': 'PAINTER',
        '내장공': 'INTERIOR_FINISHER',
        '도배공': 'WALLPAPER_INSTALLER',
        '연마공': 'POLISHER',
        '석공': 'STONEMASON',
        '줄눈공': 'GROUT_WORKER',
        '판넬조립공': 'PANEL_ASSEMBLER',
        '지붕잇기공': 'ROOFER',
        '조경공': 'LANDSCAPER',
        '코킹공': 'CAULKER',
        '배관공': 'PLUMBER',
        '보일러공': 'BOILER_TECHNICIAN',
        '위생공': 'SANITARY_TECHNICIAN',
        '덕트공': 'DUCT_INSTALLER',
        '보온공': 'INSULATION_WORKER',
        '기계설비공': 'MECHANICAL_EQUIPMENT_TECHNICIAN',
        '내선전공': 'ELECTRICIAN',
        '통신내선공': 'TELECOMMUNICATIONS_INSTALLER',
        '통신설비공': 'TELECOMMUNICATIONS_EQUIPMENT_INSTALLER',
        // 기존 영문 키들도 유지 (하위 호환성)
        'concrete': 'CONCRETE_WORKER',
        'rebar': 'REBAR_WORKER',
        'carpenter': 'CONSTRUCTION_CARPENTER',
        'electric': 'ELECTRICIAN',
        'plumber': 'PLUMBER',
        'tile': 'TILE',
        'painter': 'PAINTER',
        'general': 'NORMAL'
    };

    const workExperienceRequest = experienceList.map(exp => ({
        tech: techMapping[exp.skill] || exp.skill.toUpperCase(),
        experienceMonths: parseInt(exp.years) * 12
    }));

    // 기본값이 없을 경우 임시 경력 추가
    if (workExperienceRequest.length === 0) {
        workExperienceRequest.push({
            tech: "NORMAL",
            experienceMonths: 24
        });
    }

    // 약관 동의
    const termsInput = document.getElementById('terms');
    const privacyConsent = termsInput ? termsInput.checked : false;
    const credentialLiabilityConsent = true; // 기본값

    return {
        loginId: phoneNumber,
        password: password,
        phone: phoneNumber,
        email: email,
        role: "ROLE_WORKER",
        privacyConsent: privacyConsent,
        deviceToken: "token", // 웹용 임시 토큰
        isNotification: true,
        workerName: workerName,
        birth: birth,
        gender: gender,
        nationality: nationality,
        accountHolder: accountHolder,
        account: account,
        bank: bank,
        workerCardNumber: null,
        credentialLiabilityConsent: credentialLiabilityConsent,
        workExperienceRequest: workExperienceRequest,
        address: address,
        latitude: latitude,
        longitude: longitude
    };
}

// 회원가입 API 호출
async function submitWorkerJoin(formData) {
    try {
        const url = signupApiConfig.getWorkerJoinUrl();
        console.log('회원가입 API 호출:', url);
        console.log("formData : ", formData)

        // FormData 생성
        const multipartFormData = new FormData();

        // Body 데이터를 JSON 문자열로 추가
        multipartFormData.append('request', JSON.stringify(formData));

        // 이미지 파일들 (빈 파일로 추가)
        multipartFormData.append('educationCertificateImage', '');
        multipartFormData.append('workerCardImage', '');
        multipartFormData.append('signatureImage', '');

        console.log('전송할 FormData:', {
            body: formData,
            educationCertificateImage: '',
            workerCardImage: '',
            signatureImage: ''
        });

        const response = await fetch(url, {
            method: 'POST',
            body: multipartFormData
        });

        const result = await response.json();
        console.log('회원가입 응답:', result);

        if (!response.ok) {
            // 오류 응답 처리
            if (result.data && result.data.status === 'CONFLICT') {
                // 중복 오류 (아이디, 전화번호 등)
                throw new Error(result.data.errorMessage || '이미 등록된 정보입니다.');
            } else {
                // 기타 서버 오류
                let errorMessage = '회원가입에 실패했습니다.';

                if (response.status === 400) {
                    errorMessage = '입력한 정보를 확인해주세요.';
                } else if (response.status === 500) {
                    errorMessage = '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
                } else if (result.data && result.data.errorMessage) {
                    errorMessage = result.data.errorMessage;
                }

                throw new Error(errorMessage);
            }
        }

        // 성공 응답 (data가 null인 경우)
        return {
            success: true,
            message: result.message || '회원가입이 완료되었습니다.',
            data: result.data
        };

    } catch (error) {
        console.error('회원가입 오류:', error);

        // 네트워크 오류 처리
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('네트워크 연결을 확인해주세요.');
        }

        // JSON 파싱 오류 처리
        if (error.name === 'SyntaxError') {
            throw new Error('서버 응답을 처리할 수 없습니다.');
        }

        throw error;
    }
}

// 회원가입 처리 메인 함수
async function processSignup() {
    try {
        // 모든 단계 유효성 검사
        if (!isPhoneVerified) {
            showNotification('전화번호 인증을 완료해주세요.', 'error');
            return;
        }

        // 최종 유효성 검사
        if (!validateCurrentStep()) {
            return;
        }

        // 로딩 표시
        showNotification('회원가입을 처리중입니다...', 'info');

        // 폼 데이터 수집
        const formData = collectSignupFormData();
        console.log('수집된 폼 데이터:', formData);

        // 필수 필드 검증
        if (!formData.phone || !formData.email || !formData.password) {
            showNotification('필수 정보가 누락되었습니다. 모든 단계를 완료해주세요.', 'error');
            return;
        }

        // API 호출
        const result = await submitWorkerJoin(formData);

        if (result.success) {
            // 성공 처리
            showNotification('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.', 'success');

            // 2초 후 로그인 페이지로 이동
            setTimeout(() => {
                // 회원가입 폼 초기화
                resetSignupForm();

                // 홈 페이지로 이동 후 로그인 모달 표시
                if (typeof showPage === 'function') {
                    showPage('home');
                }
                if (typeof showLoginModal === 'function') {
                    showLoginModal();
                }
            }, 2000);
        }

    } catch (error) {
        console.error('회원가입 처리 오류:', error);
        showNotification(error.message || '회원가입 중 오류가 발생했습니다.', 'error');
    }
}

// ============================================
// 유틸리티 함수들
// ============================================

// 전화번호 자동 포맷팅
function formatPhoneNumber(input) {
    let value = input.value.replace(/[^\d]/g, '');

    if (value.length >= 3 && value.length <= 7) {
        value = value.replace(/(\d{3})(\d{1,4})/, '$1-$2');
    } else if (value.length >= 8) {
        value = value.replace(/(\d{3})(\d{4})(\d{1,4})/, '$1-$2-$3');
    }

    input.value = value;
}

// 계좌번호 숫자만 입력 처리
function formatAccountNumber(input) {
    // 숫자가 아닌 문자 제거
    input.value = input.value.replace(/[^\d]/g, '');
}

// 주소 검색 함수
function searchAddress() {
    // 실제 구현시에는 다음 우편번호 서비스나 카카오 주소 API 사용
    showNotification('주소 검색 기능을 구현중입니다.', 'info');
}

// 회원가입 폼 초기화
function resetSignupForm() {
    // 단계 초기화
    currentStep = 1;
    isPhoneVerified = false;

    // 모든 단계 숨기기
    const steps = document.querySelectorAll('.form-step');
    steps.forEach(step => step.classList.remove('active'));

    // 첫 번째 단계 활성화
    const firstStep = document.getElementById('step1');
    if (firstStep) {
        firstStep.classList.add('active');
    }

    // 단계 인디케이터 초기화
    const dots = document.querySelectorAll('.step-dot');
    dots.forEach((dot, index) => {
        dot.classList.remove('active', 'completed');
        if (index === 0) {
            dot.classList.add('active');
        }
    });

    // 전화번호 인증 폼 초기화
    resetVerificationForm();

    // 모든 입력 필드 초기화
    const form = document.getElementById('signupForm');
    if (form) {
        form.reset();
    }

    // 선택된 기술들 초기화
    const skillItems = document.querySelectorAll('.skill-item');
    skillItems.forEach(item => item.classList.remove('selected'));

    // 선택된 경험 레벨 초기화
    const experienceItems = document.querySelectorAll('.experience-item');
    experienceItems.forEach(item => item.classList.remove('selected'));

    // 선택된 국적 초기화
    const nationalityItems = document.querySelectorAll('.nationality-item');
    nationalityItems.forEach(item => item.classList.remove('selected'));

    // 경력 및 자격증 목록 초기화
    experienceList = [];
    certificatesList = [];
    renderExperienceList();
    renderCertificatesList();

    // 경력 섹션 숨기기
    const experienceSection = document.getElementById('experienceSection');
    if (experienceSection) {
        experienceSection.style.display = 'none';
    }

    // 자기소개 글자수 카운터 초기화
    const charCountElement = document.getElementById('charCount');
    if (charCountElement) {
        charCountElement.textContent = '0';
    }

    // 타이머 정리
    if (verificationTimer) {
        clearInterval(verificationTimer);
        verificationTimer = null;
    }
}

// ============================================
// 이벤트 리스너 초기화
// ============================================

// 회원가입 관련 이벤트 리스너 초기화
function initializeSignupEventListeners() {
    // 회원가입 폼 제출
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // 회원가입 처리 함수 호출
            processSignup();
        });
    }

    // 전화번호 입력 자동 포맷팅
    const phoneInput = document.getElementById('phoneNumber');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            formatPhoneNumber(this);
        });
    }

    // 인증번호 입력 시 자동 검증
    const verificationCodeInput = document.getElementById('verificationCode');
    if (verificationCodeInput) {
        verificationCodeInput.addEventListener('input', function() {
            // 6자리 입력 시 자동으로 검증 시도
            if (this.value.length === 6) {
                verifyPhoneNumber();
            }
        });
    }

    // 경력 추가 폼 제출
    const experienceForm = document.getElementById('experienceForm');
    if (experienceForm) {
        experienceForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const experienceData = {
                skill: document.getElementById('experienceSkill').value,
                years: document.getElementById('experienceYears').value
            };

            // 유효성 검사
            if (!experienceData.skill) {
                showNotification('직종을 선택해주세요.', 'error');
                return;
            }

            if (!experienceData.years) {
                showNotification('경력 년수를 선택해주세요.', 'error');
                return;
            }

            // 같은 직종이 이미 있는지 확인
            const existingExperience = experienceList.find(exp => exp.skill === experienceData.skill);
            if (existingExperience) {
                showNotification('이미 해당 직종의 경력이 추가되어 있습니다.', 'error');
                return;
            }

            addExperience(experienceData);
            closeExperienceModal();
            showNotification('경력이 추가되었습니다.', 'success');
        });
    }

    // 계좌번호 입력 포맷팅
    const accountNumberInput = document.getElementById('accountNumber');
    if (accountNumberInput) {
        accountNumberInput.addEventListener('input', function() {
            formatAccountNumber(this);
        });
    }

    // 자기소개 글자수 카운터
    const selfIntroTextarea = document.querySelector('textarea[name="selfIntroduction"]');
    const charCountElement = document.getElementById('charCount');
    if (selfIntroTextarea && charCountElement) {
        selfIntroTextarea.addEventListener('input', function() {
            charCountElement.textContent = this.value.length;
        });
    }

    // 이메일 실시간 검증
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            const email = this.value.trim();
            const isValid = validateEmail(email);
            showEmailValidation(email, isValid);
        });

        emailInput.addEventListener('blur', function() {
            const email = this.value.trim();
            if (email && !validateEmail(email)) {
                showEmailValidation(email, false);
            }
        });
    }

    // 회원가입 페이지 진입 시 초기화
    document.addEventListener('click', function(e) {
        if (e.target.textContent === '무료 가입하기' || e.target.textContent === '회원가입') {
            resetSignupForm();
        }
    });
}

// 페이지 로드 시 회원가입 이벤트 리스너 초기화
document.addEventListener('DOMContentLoaded', async function() {
    // API 설정 로드
    try {
        await signupApiConfig.loadConfigFromServer();
        console.log('Signup API 설정 초기화 완료:', signupApiConfig.baseUrl);
    } catch (error) {
        console.warn('Signup API 설정 로드 실패, 기본값 사용:', error);
    }

    // 이벤트 리스너 초기화
    initializeSignupEventListeners();
});