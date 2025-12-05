# 📋 프로젝트 개요

Layout Maker는 **Electron + React + TypeScript** 기반의 데스크톱 애플리케이션으로, **C++ 엔진**을 결합하여 레이아웃 디자인 및 최적화 작업을 수행하는 도구입니다.

## ✨ 주요 기능

- 📐 **레이아웃 요소 그리기** - 사각형, 다각형
- 🤖 **머신 객체 배치**
- 📊 **C++ 엔진을 통한 면적 계산**
- 🎯 **객체 그룹화 및 스냅 기능**
- 📏 **단위 변환** - px, mm, m
- 🔍 **줌/팬 기능**
- 🔒 **속성 편집 및 잠금**

---

## 🗂️ 프로젝트 구조

```
layoutMaker/
├── cpp/                          # C++ 엔진 (계산 라이브러리)
│   ├── engine.cpp               # C++ 소스 코드
│   ├── CMakeLists.txt           # CMake 빌드 설정
│   └── build/                   # 빌드 출력물 (libengine.dylib/dll/so)
│
├── electron-app/                 # Electron 애플리케이션
│   ├── electron/                 # Electron 메인 프로세스
│   │   ├── main.ts              # 메인 프로세스 (C++ 라이브러리 로딩)
│   │   └── preload.ts           # Preload 스크립트 (IPC 브릿지)
│   │
│   ├── src/                      # React 애플리케이션
│   │   ├── App.tsx              # 메인 앱 컴포넌트
│   │   ├── main.tsx             # React 진입점
│   │   ├── components/          # UI 컴포넌트
│   │   │   ├── Canvas.tsx       # Konva 기반 캔버스
│   │   │   └── PropertiesPanel.tsx  # 속성 패널
│   │   ├── store/               # 상태 관리
│   │   │   └── useStore.ts      # Zustand 스토어
│   │   └── types/               # TypeScript 타입 정의
│   │
│   ├── dist/                     # 빌드된 웹 애플리케이션
│   ├── dist-electron/            # 빌드된 Electron 코드
│   ├── package.json              # 프로젝트 설정 및 의존성
│   └── vite.config.ts            # Vite 빌드 설정
│
└── docs/                         # 📚 문서 폴더
    ├── README.md                # 문서 목차
    ├── overview/                # 프로젝트 개요
    ├── architecture/            # 아키텍처
    ├── components/              # 컴포넌트 설명
    ├── features/                # 기능 설명
    └── development/             # 개발 가이드
```

---

## ✨ 프로젝트 특징

| 특징 | 설명 |
|------|------|
| **하이브리드 아키텍처** | JavaScript/TypeScript UI + C++ 고성능 엔진 |
| **크로스 플랫폼** | Windows, macOS, Linux 지원 |
| **모던 스택** | React 19, Vite, TypeScript 최신 기술 |
| **실시간 렌더링** | Konva 기반 고성능 캔버스 |
| **확장 가능** | FFI를 통해 더 많은 C++ 기능 추가 가능 |

---

**다음 문서**: [기술 스택](../architecture/tech-stack.md)
