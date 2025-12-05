# ⚡ Electron 메인 프로세스

> **경로**: `electron-app/electron/`

Electron 애플리케이션의 메인 프로세스를 담당합니다.

---

## 📁 파일 구조

```
electron-app/electron/
├── main.ts       # 메인 프로세스 진입점
└── preload.ts    # Preload 스크립트 (IPC 브릿지)
```

---

## 📄 main.ts

Electron 메인 프로세스의 진입점입니다.

### 주요 기능

#### 1. C++ 라이브러리 로딩

```typescript
const libPath = app.isPackaged
    ? path.join(process.resourcesPath, 'libengine.dylib')
    : path.resolve(__dirname, '../../cpp/build/libengine.dylib')
const lib = koffi.load(libPath)
```

#### 2. IPC 핸들러 등록

| 핸들러 | 설명 |
|--------|------|
| `calculate-area` | 사각형 면적 계산 |
| `calculate-polygon-area` | 다각형 면적 계산 |

#### 3. 브라우저 윈도우 생성

| 설정 | 값 |
|------|-----|
| 크기 | 1200 x 800 |
| contextIsolation | 활성화 (보안) |
| preload | 스크립트 로딩 |

---

## 📄 preload.ts

렌더러 프로세스와 메인 프로세스 간 안전한 IPC 브릿지를 제공합니다.

### 노출된 API

```typescript
contextBridge.exposeInMainWorld('electron', {
    invoke: (channel: string, ...args: any[]) => 
        ipcRenderer.invoke(channel, ...args)
})
```

---

**다음 문서**: [React 애플리케이션](react-app.md)
