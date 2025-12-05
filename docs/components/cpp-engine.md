# 🔧 C++ 엔진

> **경로**: `cpp/`

C++로 작성된 고성능 계산 엔진으로, Electron에서 FFI를 통해 호출됩니다.

---

## 📁 파일 구조

```
cpp/
├── engine.cpp          # C++ 소스 코드
├── CMakeLists.txt      # CMake 빌드 설정
└── build/              # 빌드 출력물
    └── libengine.*     # .dylib (macOS) / .dll (Windows) / .so (Linux)
```

---

## 📄 engine.cpp

### 주요 함수

| 함수 | 설명 |
|------|------|
| `calculateArea(width, height)` | 사각형 면적 계산 |
| `calculatePolygonArea(points, count)` | Shoelace 공식을 사용한 다각형 면적 계산 |

### 예시 코드

```cpp
extern "C" {
    double calculateArea(double width, double height) {
        return width * height;
    }
    
    double calculatePolygonArea(double* points, int count) {
        // Shoelace formula implementation
        // ...
    }
}
```

---

## ⚙️ CMakeLists.txt

- **C++ 표준**: C++17
- **빌드 타입**: 공유 라이브러리 (SHARED)
- **플랫폼별 확장자**: 자동 설정

---

## 🔨 빌드 출력물

| 플랫폼 | 파일명 |
|--------|--------|
| macOS | `libengine.dylib` |
| Windows | `libengine.dll` |
| Linux | `libengine.so` |

---

**다음 문서**: [Electron 메인 프로세스](electron-main.md)
