# 🚀 MinHo Automation (QA Portfolio)
카카오톡 서비스 및 주요 웹 플랫폼의 품질 보증을 위한 Playwright 기반 E2E 테스트 자동화 프레임워크입니다.
단순한 스크립트 작성을 넘어, 지속적 통합(CI) 환경 구축과 유지보수성을 고려한 설계에 집중했습니다.

## 🛠 Tech Stack
- Language: TypeScript / Node.js

- Test Runner: Playwright

- DB : SQLite

- CI/CD: GitHub Actions

- Infrastructure: Oracle Cloud (Docker-based execution environment)

## 📂 Project Structure & Design Intent
프로젝트의 유지보수성을 높이기 위해 관심사를 분리하여 설계했습니다.

## 💡 주요 설계 포인트
단순한 기능 검증을 넘어, 테스트의 가시성을 높이고 복잡한 비즈니스 로직을 안정적으로 자동화하는 데 집중했습니다.

### Real-time Test Monitoring (Socket.io)

기술적 도전: 클라우드(Oracle Cloud) 환경에서 헤드리스(Headless)로 돌아가는 자동화 과정은 블랙박스와 같아 디버깅이 어렵다는 단점이 있습니다.

해결 방안: Socket.io를 활용한 양방향 통신을 구축했습니다. 서버에서 수행되는 Playwright의 각 단계(Step) 로그와 스크린샷 데이터를 실시간으로 클라이언트 대시보드에 전송하여, 외부에서도 테스트 진행 상황을 실시간으로 감상하고 모니터링할 수 있는 환경을 구현했습니다.

### Complex E2E Business Logic (Commerce)

카카오톡 선물하기 여정 구현: 단순 페이지 진입이 아닌, '상품 담기 → 옵션 선택(복합 레이어 처리) → 주문서 진입'으로 이어지는 **커머스 핵심 사용자 여정(User Journey)**을 자동화했습니다. 각 단계별 비동기 처리와 예외 상황을 고려한 대기 로직(Auto-waiting)을 설계하여 높은 테스트 안정성을 확보했습니다.

### Dynamic Workflow Validation (Travel/O2O)

숙박 예약 플랫폼 로직: '날짜 선택 → 지역 검색 → 상세 페이지 → 예약 진입'으로 이어지는 복잡한 데이터 의존성(Data Dependency)을 처리했습니다. 날짜 선택 시의 캘린더 인터페이스 제어 및 동적 지역 데이터 로딩을 효율적으로 처리하는 로직을 구현하여 예약 도메인의 특수성을 반영했습니다.

### Data Entry Automation (C2C Marketplace)

중고거래 플랫폼 상품 업로드: 다중 이미지 업로드, 카테고리 자동 선택, 가격 입력 등 입력 폼(Form)이 많은 중고거래 서비스의 특성을 반영했습니다. 반복적인 업로드 수동 테스트를 자동화하여 운영 효율을 개선하고, 복잡한 폼 검증(Validation)을 자동화했습니다.
