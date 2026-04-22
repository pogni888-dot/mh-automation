🚀 Levyplay Automation (QA Portfolio)
카카오톡 서비스 및 주요 웹 플랫폼의 품질 보증을 위한 Playwright 기반 E2E 테스트 자동화 프레임워크입니다.
단순한 스크립트 작성을 넘어, 지속적 통합(CI) 환경 구축과 유지보수성을 고려한 설계에 집중했습니다.

🛠 Tech Stack
Language: JavaScript / Node.js

Test Runner: Playwright

CI/CD: GitHub Actions

Infrastructure: Oracle Cloud (Docker-based execution environment)

📂 Project Structure & Design Intent
프로젝트의 유지보수성을 높이기 위해 관심사를 분리하여 설계했습니다.

💡 주요 설계 포인트
Multi-Platform Testing: test:chrome과 test:mobile 스크립트를 분리하여, 데스크톱과 모바일 웹 환경 모두에서 동일한 비즈니스 로직이 작동하는지 검증합니다.

CI Pipeline Integration: GitHub Actions를 통해 코드 푸시 시 자동으로 테스트가 수행되도록 구축하여, 배포 전 결함을 조기에 발견하는 시스템을 지향합니다.

Evidence-based Debugging: 테스트 실패 시 스크린샷과 비디오 리포트를 생성하도록 설정하여, 결함 발생 시 원인 파악 시간을 단축했습니다.

🚀 Setup & Execution
1. Install dependencies
2. Run Tests
⚙️ CI/CD Service
이 프로젝트는 GitHub Actions와 연동되어 있습니다. .github/workflows/playwright.yml 설정을 통해 클라우드 환경에서 자동화된 테스트를 수행합니다.
