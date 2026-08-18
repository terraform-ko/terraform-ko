# 기여 가이드

Terraform 한국어 번역 프로젝트에 참여해 주셔서 감사합니다. 다음은 기여 가능한 항목입니다.

1. 새로운 문서 번역
2. 기 번역된 문서의 오타·오역·컨벤션 수정 ([STYLE_GUIDE.md](./STYLE_GUIDE.md) 기준)
3. 사이트(Next.js + Nextra) 테마 개선 및 기능 추가
4. `scripts/`를 포함한 코드 상의 버그 및 문제점 수정

## 문서 번역 방법

### Prerequisites

- git
- Node.js
- npm

### 이슈 할당 방법

1. 번역하려는 문서를 [Issue](../../issues)로 등록하거나, 기존 이슈 중 담당자가 없는 항목을 자신에게 assign 합니다. 중복 작업을 막기 위한 절차이니 꼭 지켜주세요.
   - 새로 등록할 때는 `.github/ISSUE_TEMPLATE/translation-request.md` 템플릿을 사용합니다.
   - 오탈자/오역 제보는 `.github/ISSUE_TEMPLATE/typo-fix.md` 템플릿을 사용합니다.
2. registry.terraform.io 관련 문서라면 이 레포가 아닌 [terraform-registry-ko](https://github.com/terraform-ko/terraform-registry-ko)에 등록해주세요.

### 번역 방법

1. 이 레포지토리를 포크합니다.
2. 포크한 레포지토리를 로컬에 클론합니다.
   ```bash
   git clone https://github.com/[YOUR_USERNAME]/terraform-ko
   cd terraform-ko
   ```
3. `npm install` 명령어로 의존성을 설치합니다.
4. `npm run dev` 명령어로 로컬(http://localhost:3000)에서 확인합니다.
5. 브랜치를 생성합니다. `[username]-[translate|fix]-[section]` 형식을 권장합니다.
   - 예: `wlstmd-translate-cli-plan`, `wlstmd-fix-style-guide`
6. `src/content/` 아래에는 `origin/`의 모든 문서에 대응하는 파일이 이미 만들어져 있습니다(빈 스텁 포함). 번역할 파일을 찾아 내용을 채웁니다.
   - 예: 번역할 문서가 `origin/terraform/docs/cli/commands/plan.mdx`라면 → `src/content/cli/commands/plan.mdx` (`/cli/commands/plan`)를 엽니다.
   - 아직 번역 안 된 파일은 `translated: false` frontmatter와 "번역 필요" 안내 문구만 있습니다. `source` frontmatter에 원문 경로가 적혀 있으니 참고해 번역하고, 다 쓰면 `translated: false` 줄과 안내 문구를 지워주세요.
   - `origin/`은 용량 문제로 이 레포에 커밋되어 있지 않습니다. 한두 문서만 번역할 때는 로컬에 `origin/`이 없어도 [hashicorp/web-unified-docs](https://github.com/hashicorp/web-unified-docs)의 `content/terraform/`(또는 mdx 상단 `source` 경로)에서 원문을 직접 확인하며 작업할 수 있습니다. `scaffold-content.mjs`/`audit-structure.mjs` 같은 스크립트를 돌리려면 해당 레포의 내용을 로컬 `origin/` 아래에 동일한 경로로 받아와야 합니다.
   - 원문(`origin/`)은 직접 수정하지 않습니다. `origin/`이 갱신되면 `node scripts/scaffold-content.mjs`로 새 문서의 스텁을 만들 수 있습니다(기존 번역은 덮어쓰지 않습니다). 새 섹션(폴더)이 생겼다면 스크립트가 `_meta.ts`도 함께 생성/갱신합니다.
7. 커밋 전 `npm run format`(prettier)과 `npm run lint`을 실행해 포맷/린트를 확인합니다.

### PR 제출 방법

- 커밋 메시지 컨벤션은 다음과 같습니다.

  ```bash
  [#IssueNo|no-issue] type: subject

  => e.g. [#12] translate: cli/commands/plan, [no-issue] fix: 오탈자 수정

  'translate', // 새 문서 번역
  'fix',       // 오탈자·오역 수정
  'docs',      // README, STYLE_GUIDE 등 문서 내용 추가·변경
  'feat',      // 스크립트·컴포넌트 등 새 기능 추가
  'refactor',  // 코드 리팩토링, 파일·폴더명 변경/이동
  'style',     // 코드 포맷 변경(세미콜론 등), 프로젝트 코드 스타일
  'design',    // 사이트 UI/테마 변경
  'chore',     // 빌드·패키지 매니저·설정 파일 변경
  'ci',        // CI 설정 파일 수정
  'perf',      // 성능 개선
  'remove',    // 파일 삭제
  'revert',    // 커밋한 내용 되돌리는 경우
  'test',      // 테스트 추가·리팩토링
  ```

- `main` 브랜치로 PR을 보냅니다. 관련 이슈 번호를 본문에 연결(`Closes #123`)해주세요.

## 번역 전 확인사항

- [STYLE_GUIDE.md](./STYLE_GUIDE.md)의 어조·형식·용어 규칙을 따릅니다.
- 코드 블록(HCL, CLI 커맨드 등)과 파일 경로는 번역하지 않습니다. 주석만 필요 시 한국어로 옮깁니다.
- 원활하고 빠른 번역을 위해 생성형 AI(ChatGPT 등)로 초벌 번역하는 것은 금하지 않습니다. 다만 반드시 직접 검수 후 제출해주세요 — 원문의 의미를 임의로 추가·누락하지 않아야 합니다. 예를 들어 다음과 같은 프롬프트를 참고할 수 있습니다.

  ```markdown
  Terraform 공식 문서 번역을 요청할거야. 주의사항이 있는데,

  1. 마크다운/MDX 파일 그대로 사용할거니까 영어에서 한국어로 번역하되, 마크다운 문법과 frontmatter는 번역하지 않도록 조심해줘.
  2. provider, state, backend 같은 Terraform 개발 용어는 무리하게 번역하지 말고 원문 그대로 유지해줘.
  3. HCL 코드 블록, CLI 커맨드, 파일 경로는 번역하지 말고 그대로 둬. 코드 안 주석만 필요하면 한국어로 옮겨줘.
  4. 공식문서이니까 문장을 추가하거나 제거하지 말고 "있는 그대로" 번역해줘.
  5. 원문 영어와 번역을 같이 제공할 필요없어. 원문은 제공하지 마

  이해했는지 대답해주고 다음에 내가 보낸 문서부터 새로 번역할 준비 해줘
  ```

## 리뷰

- 최소 1인 이상의 리뷰 승인 후 병합합니다.
- 용어/톤 불일치, 원문 누락·오역 위주로 리뷰합니다.
