# 📝 개발 가이드

## 🚀 새 기능 추가 시

1. **C++ 함수 추가** → `engine.cpp`에 `extern "C"` 함수 작성
2. **메인 프로세스** → `main.ts`에서 Koffi로 로딩, IPC 핸들러 등록
3. **Preload** → `preload.ts`에 API 노출
4. **React** → `App.tsx`나 컴포넌트에서 `window.electron` 사용
5. **상태 관리** → 필요시 `useStore.ts`에 상태/액션 추가

---

## 🛠️ 주요 설정 파일

| 파일 | 용도 |
|------|------|
| `vite.config.ts` | Vite 빌드 설정, Electron 플러그인 |
| `tsconfig.json` | TypeScript 컴파일러 설정 |
| `eslint.config.js` | ESLint 린팅 규칙 |
| `CMakeLists.txt` | C++ 빌드 설정 |
| `package.json` | 의존성 및 빌드 스크립트 |

---

## 🔐 보안 고려사항

### Context Isolation

| 설정 | 설명 |
|------|------|
| **활성화** | 렌더러 프로세스와 Node.js 환경 분리 |
| **Preload Script** | 안전한 IPC 통신 제공 |

### Node Integration

| 설정 | 설명 |
|------|------|
| **비활성화** | 렌더러에서 직접 Node.js 사용 불가 |
| **IPC만 허용** | 메인 프로세스와 통신만 가능 |

---

## 🔨 빌드 스크립트

```json
{
  "dev": "vite",                    // 개발 서버 실행
  "build": "tsc -b && vite build",  // 프로덕션 빌드
  "package": "npm run build && electron-builder"  // 실행 파일 생성
}
```

---

## 📦 빌드 설정

| 설정 | 값 |
|------|-----|
| appId | `com.layoutmaker.app` |
| 리소스 | C++ 라이브러리(`libengine.dylib`) 포함 |
| 출력 | macOS DMG 파일 생성 |

> 자세한 빌드 방법은 [BUILD.md](../../BUILD.md)를 참조하세요.

---

**마지막 업데이트**: 2025-12-04
