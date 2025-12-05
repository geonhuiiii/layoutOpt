# ⚛️ React 애플리케이션

> **경로**: `electron-app/src/`

React 기반의 UI 애플리케이션입니다.

---

## 📁 파일 구조

```
electron-app/src/
├── App.tsx              # 메인 앱 컴포넌트
├── main.tsx             # React 진입점
├── components/
│   ├── Canvas.tsx       # Konva 기반 캔버스
│   └── PropertiesPanel.tsx  # 속성 패널
├── store/
│   └── useStore.ts      # Zustand 스토어
└── types/               # TypeScript 타입 정의
```

---

## 📄 App.tsx

메인 애플리케이션 컴포넌트로, 전체 UI를 구성합니다.

### 주요 기능

- **툴바**: 도형 추가, 그룹화, 스냅, 단위 변환, 줌/팬
- **레이아웃**: 캔버스와 속성 패널
- **키보드 이벤트**: Delete/Backspace로 삭제
- **C++ 엔진 호출**: 면적 계산

---

## 📄 components/Canvas.tsx

Konva 기반의 캔버스 컴포넌트입니다.

### 주요 기능

| 기능 | 설명 |
|------|------|
| **레이아웃 요소 렌더링** | 사각형, 다각형 - Group으로 감싸서 텍스트와 함께 렌더링 |
| **머신 객체 렌더링** | Group으로 감싸서 이름 텍스트와 함께 렌더링 |
| **그룹 드래그** | 모든 요소 타입(사각형, 다각형, 머신)이 그룹화 시 함께 이동 |
| **텍스트 라벨** | 모든 요소에 텍스트 표시, 드래그 시 함께 이동 |
| **동적 텍스트 크기** | 줌 레벨과 컨테이너 크기에 따라 폰트 크기 자동 조정 (8px~48px) |
| **스냅 기능** | 그리드, 객체 스냅 |
| **줌/팬** | 마우스 휠, 스페이스바 드래그 |
| **면적 표시** | 실시간 계산, 초기 생성 시 즉시 표시 |
| **Area Lock** | TransformEnd 이벤트에서 Area 잠금 상태 확인 및 크기 자동 보정 |

---

## 📄 components/PropertiesPanel.tsx

선택된 객체의 속성을 표시하고 편집하는 패널입니다.

### 주요 기능

- **위치, 크기, 회전 편집**: 직접 입력 가능한 Input 필드 제공
- **속성 잠금**: X, Y, Width, Height, Area 각각에 대한 잠금(Lock) 토글 기능
- **Area Lock**: 면적 고정 시 가로/세로 비율 자동 조정 로직 포함
- **색상 변경**
- **이름 변경** (머신)
- **면적 표시** (레이아웃)

---

## 📄 store/useStore.ts

Zustand를 사용한 전역 상태 관리입니다.

### 상태

```typescript
{
  layouts: Layout[],        // 레이아웃 요소 배열
  machines: Machine[],      // 머신 객체 배열
  selectedIds: string[],    // 선택된 객체 ID
  snapping: SnappingConfig, // 스냅 설정
  unit: 'px' | 'mm' | 'm',  // 단위
  scale: number,            // 줌 배율
  position: { x, y },       // 캔버스 위치 (팬)
}
```

### 주요 액션

| 액션 | 설명 |
|------|------|
| `addLayout`, `removeLayout`, `updateLayout` | 레이아웃 관리 |
| `addMachine`, `removeMachine`, `updateMachine` | 머신 관리 |
| `setSelectedIds`, `groupItems`, `ungroupItems` | 선택/그룹화 |
| `setSnapping`, `setUnit`, `setScale`, `setPosition` | 설정 |

---

**다음 문서**: [주요 기능](../features/features.md)
