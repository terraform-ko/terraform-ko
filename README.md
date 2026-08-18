<p align="center">
  <a href="https://developer.hashicorp.com/terraform">
    <img src="src/app/icon.svg" width="64" height="64" alt="Terraform" />
    <h1 align="center">Terraform 문서 한국어 번역 프로젝트</h1>
  </a>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="./CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome" /></a>
</p>

## 안녕하세요!

[Terraform](https://developer.hashicorp.com/terraform) 공식 문서를 한국어로 번역하는 커뮤니티 프로젝트입니다.

- `developer.hashicorp.com/terraform` 문서의 전체 한국어 번역을 목표로 합니다.
- 원문은 [hashicorp/web-unified-docs](https://github.com/hashicorp/web-unified-docs) (`content/terraform/`)를 기준으로 합니다.
- 레지스트리(`registry.terraform.io`) 번역은 별도 레포([terraform-registry-ko](https://github.com/terraform-ko/terraform-registry-ko))에서 진행합니다.

## 기술 스택

Next.js (App Router) + Nextra + TypeScript

## 폴더 구조

```
terraform-ko/
├── origin/                    # 원문 스냅샷 (번역 대상 원본, 직접 수정하지 않음, git 미포함)
│   └── terraform/docs/...     # hashicorp/web-unified-docs 구조 그대로 (cli, language, internals, intro)
├── src/
│   ├── app/                    # Next.js App Router (레이아웃, mdx 라우팅, 전역 스타일)
│   └── content/                # 실제 사이트 = 번역. origin/과 거의 동일한 경로 구조
│       ├── cli/index.mdx        # 번역 완료
│       └── language/index.mdx   # 아직 미번역 — 빈 스텁 (frontmatter만 있고 본문은 "번역 필요" 안내)
├── scripts/
│   ├── scaffold-content.mjs   # origin/ 전체 구조에 맞춰 빈 스텁 + _meta.ts를 재생성하는 스크립트
│   ├── audit-structure.mjs    # STRUCTURE.md 재생성 (공식 nav-data 기준 구조 감사)
│   ├── verify-titles.mjs      # 모든 제목/폴더 라벨이 공식 nav-data와 일치하는지 검증
│   └── verify-all-pages.mjs   # 로컬 서버에 모든 페이지를 실제로 요청해 200인지 전수 검증
├── STYLE_GUIDE.md   # 번역 톤/형식/용어 가이드
└── CONTRIBUTING.md  # 참여 방법
```

`src/content/` 아래에는 `origin/`에 있는 문서 전체에 대응하는 파일이 이미 만들어져 있습니다. 아직 번역되지 않은 파일은 `translated: false` frontmatter와 "번역 필요" 안내만 있는 빈 상태이며, 사이드바에서 바로 확인할 수 있습니다. 번역하고 싶은 문서를 골라 내용을 채우고 `translated: false` 줄을 지우면 됩니다. `origin/`이 최신화되면 `node scripts/scaffold-content.mjs`를 다시 실행해 새로 추가된 문서의 스텁을 만들 수 있습니다(기존 번역은 덮어쓰지 않습니다).

## 로컬 실행

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드
```

## 참여하기

기여 방법은 [CONTRIBUTING.md](./CONTRIBUTING.md)를, 번역 스타일과 용어는 [STYLE_GUIDE.md](./STYLE_GUIDE.md)를 참고해주세요.

## 라이선스

번역 결과물은 [MIT License](./LICENSE)를 따릅니다. 원문 저작권은 HashiCorp에 있습니다.

## Contributors ✨

감사합니다 🥰

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
<tbody>
    <tr>
        <td align="center" valign="top" width="14.28%"><a href="https://litt.ly/jinseung_"><img src="https://avatars.githubusercontent.com/u/127307160?v=4?s=100" width="100px;" alt="Jinseung"/><br /><sub><b>Jinseung</b></sub></a><br /><a href="https://github.com/terraform-ko/terraform-ko/commits?author=wlstmd" title="Content">🖋</a></td>
    </tr>
</tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
