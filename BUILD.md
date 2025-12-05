# Layout Maker 빌드 가이드

## 🚀 개발 워크플로우

### 1. 개발 환경 실행
```bash
cd electron-app
npm run dev
```
- Vite 개발 서버 시작
- HMR (Hot Module Replacement) 활성화
- DevTools 자동 오픈

### 2. 프로덕션 빌드
```bash
# C++ 라이브러리 빌드
cd cpp
mkdir build && cd build
cmake ..
make

# Electron 앱 빌드
cd ../../electron-app
npm run build
```

### 3. 실행 파일 패키징
```bash
cd electron-app
npm run package
```
- macOS: `.dmg` 파일 생성
- C++ 라이브러리를 리소스에 포함

---

## 🛠️ 주요 빌드 스크립트

`electron-app/package.json`에 정의된 스크립트:

```json
{
  "dev": "vite",                    // 개발 서버 실행
  "build": "tsc -b && vite build",  // 프로덕션 빌드
  "package": "npm run build && electron-builder"  // 실행 파일 생성
}
```

---

## 📦 빌드 설정

### Electron Builder 설정 (`package.json`)
- **appId**: `com.layoutmaker.app`
- **C++ 라이브러리** (`libengine.dylib`)를 리소스에 포함
- **macOS**: DMG 파일 생성

### 플랫폼별 C++ 라이브러리
빌드 출력물은 `cpp/build/` 디렉토리에 생성됩니다:
- **macOS**: `libengine.dylib`
- **Windows**: `libengine.dll`
- **Linux**: `libengine.so`

---

## ✅ 패키징 전 체크리스트

- [ ] C++ 라이브러리 빌드 완료
- [ ] `package.json`의 `extraResources` 경로 확인
- [ ] 프로덕션 빌드 테스트 (`npm run build`)
- [ ] 패키징 테스트 (`npm run package`)

---

## 🐛 디버깅

### 메인 프로세스
- VS Code Debugger 또는 `console.log` 사용

### 렌더러 프로세스
- Chrome DevTools (개발 모드에서 자동 오픈)

### C++ 라이브러리
- 로딩 확인: `console.log`로 라이브러리 경로 및 함수 로딩 상태 확인

---

## 🔧 주요 설정 파일

| 파일 | 용도 |
|------|------|
| `vite.config.ts` | Vite 빌드 설정, Electron 플러그인 |
| `tsconfig.json` | TypeScript 컴파일러 설정 |
| `eslint.config.js` | ESLint 린팅 규칙 |
| `CMakeLists.txt` | C++ 빌드 설정 |
| `package.json` | 의존성 및 빌드 스크립트 |

---

**마지막 업데이트**: 2025-12-04
