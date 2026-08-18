export function Hero() {
  return (
    <div className="tf-hero">
      <h1>코드로 인프라를 안전하고 예측 가능하게 관리하세요</h1>
      <p>
        Terraform 공식 문서를 한국어로 번역하는 커뮤니티 프로젝트입니다. 원문은 hashicorp/web-unified-docs를
        기준으로 하며, 번역이 완료되는 대로 이 사이트에 게시됩니다.
      </p>
      <div className="tf-cta-row">
        <a href="https://developer.hashicorp.com/terraform/install" target="_blank" rel="noreferrer">
          Install
        </a>
        <a href="https://developer.hashicorp.com/terraform/tutorials" target="_blank" rel="noreferrer">
          Tutorials
        </a>
        <a href="/cli">Documentation</a>
      </div>
    </div>
  )
}
