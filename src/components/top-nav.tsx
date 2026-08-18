function TerraformMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M10 8v6.2l5.2 3V11l-5.2-3Z" fill="currentColor" />
      <path d="M16.4 11v6.2l5.2 3V14L16.4 11Z" fill="currentColor" />
      <path d="M10 17.8V24l5.2 3v-6.2l-5.2-3Z" fill="currentColor" />
    </svg>
  )
}

export function TopNav() {
  return (
    <div className="tf-topnav">
      <div className="tf-topnav-row1">
        <a href="https://developer.hashicorp.com" target="_blank" rel="noreferrer" className="tf-topnav-brand">
          HashiCorp <span>Developer</span>
        </a>
        <span className="tf-topnav-row1-note">비공식 한국어 번역 프로젝트</span>
      </div>
      <div className="tf-topnav-row2">
        <a href="/" className="tf-topnav-product">
          <TerraformMark />
          terraform-ko
        </a>
        <nav className="tf-topnav-links">
          <a href="https://developer.hashicorp.com/terraform/install" target="_blank" rel="noreferrer">
            Install
          </a>
          <a href="https://developer.hashicorp.com/terraform/tutorials" target="_blank" rel="noreferrer">
            Tutorials
          </a>
          <a href="/cli">Documentation</a>
          <a href="https://developer.hashicorp.com/terraform/sandbox" target="_blank" rel="noreferrer">
            Sandbox
          </a>
        </nav>
        <div className="tf-topnav-actions">
          <a
            className="tf-topnav-outline-btn"
            href="https://registry.terraform.io"
            target="_blank"
            rel="noreferrer"
          >
            Registry
          </a>
          <a className="tf-topnav-cta" href="https://github.com/terraform-ko/terraform-ko" target="_blank" rel="noreferrer">
            번역 참여하기
          </a>
        </div>
      </div>
    </div>
  )
}
