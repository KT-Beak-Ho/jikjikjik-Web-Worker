# jikjikjik-Web-Worker
👥 직직직 구직자 플랫폼 - 개인 맞춤형 채용 정보와 AI 추천으로 나에게 맞는 구직자 전용 서비스. 매칭 수수료 무료, 임금 당일 지급, 경력관리 자동화 지원

# 직직직 구직자 플랫폼 👥

## 🎯 프로젝트 소개

직직직 구직자 플랫폼은 개인 구직자를 위한 맞춤형 채용 정보 서비스입니다. 
AI 기반 개인화 추천, 간편한 임금 및 경력 관리를 제공합니다.

## ✨ 주요 기능

### 🔍 스마트 일자리 매칭
- **개인화된 추천**: 경력과 기능에 맞는 맞춤 일자리 추천
- **실시간 알림**: 새로운 현장 모집 즉시 알림
- **거리 기반 검색**: 집 근처 일자리 우선 노출
- **조건별 필터링**: 일급, 작업 시간, 현장 환경 등 세밀한 검색

### 💰 임금 당일 지급 시스템
- **즉시 정산**: 작업 완료 후 당일 급여 지급
- **투명한 급여**: 일급, 시급 명확한 사전 고지
- **자동 계산**: 출퇴근 시간 기반 정확한 급여 계산
- **완전 무료**: 구직자에게 어떤 수수료도 부과하지 않음

### 📊 경력관리 자동화
- **자동 경력 기록**: 프로젝트별 근무 이력 자동 저장
- **기능별 경력 분류**: 철근, 형틀, 조적 등 세부 기능별 관리
- **성과 기록**: 현장 평가 및 작업 성과 누적 관리
- **서류 보관함**: 모든 업무 관련 서류 디지털 보관

### 📱 간편한 현장 정보 관리
- **QR 코드 출퇴근**: 스마트폰으로 간편한 출퇴근 체크
- **실시간 급여 확인**: 오늘 벌어들인 금액 실시간 확인
- **현장 정보**: 작업 내용, 주의사항, 교통편 등 상세 정보
## 🎨 디자인 가안 및 스타일 가이드

### 📱 웹페이지 디자인 미리보기
구직자용 웹페이지의 실제 디자인 가안을 확인할 수 있습니다:
- **라이브 데모**: [노동자 웹페이지 디자인 가안](https://claude.ai/public/artifacts/1039dd88-b56a-47b2-807f-8340a02dfaac)

## 📖 API 문서

### 설치
```
npm i fastify @fastify/cors @fastify/helmet @fastify/rate-limit fastify-type-provider-zod zod dotenv
npm i -D typescript tsx @types/node pino-pretty
npm i @fastify/static
```

### 싫행
```
npm run dev

localhost:3000/api/time
```


### 인증 관련
```
POST   /api/auth/register     # 회원가입
POST   /api/auth/login        # 로그인
POST   /api/auth/logout       # 로그아웃
GET    /api/auth/me           # 내 정보 조회
```

### 이력서 관리
```
GET    /api/resumes           # 내 이력서 목록
POST   /api/resumes           # 이력서 생성
PUT    /api/resumes/:id       # 이력서 수정
DELETE /api/resumes/:id       # 이력서 삭제
GET    /api/resumes/:id/pdf   # PDF 다운로드
```

### 채용공고
```
GET    /api/jobs              # 채용공고 검색
GET    /api/jobs/:id          # 채용공고 상세
POST   /api/jobs/:id/apply    # 채용공고 지원
GET    /api/jobs/recommended  # 추천 공고
```

## 🌍 다국어 지원

- **한국어** (기본)
- **English**
- **日本語**
- **中文**

## 📞 지원 및 피드백

- **고객센터**: help@jikjikjik.co.kr
- **버그 신고**: https://github.com/your-org/jikjikjik-worker/issues
- **기능 제안**: https://github.com/your-org/jikjikjik-worker/discussions
- **사용자 가이드**: https://help.jikjikjik.co.kr

---

**직직직과 함께 더 나은 취업의 기회를 만들어보세요! 🚀**
