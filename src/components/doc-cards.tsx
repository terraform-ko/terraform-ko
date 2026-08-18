const cards = [
  {
    title: 'Configuration Language',
    href: '/language',
    desc: 'HCL 문법, 리소스·모듈·변수 등 구성 언어 문서',
    translated: false
  },
  {
    title: 'Terraform CLI',
    href: '/cli',
    desc: 'terraform plan, apply 등 CLI 명령어와 워크플로우 문서',
    translated: true
  },
  {
    title: 'Internals',
    href: '/internals',
    desc: '스테이트 파일 포맷 등 내부 동작 원리 문서',
    translated: false
  }
]

export function DocCards() {
  return (
    <div className="tf-card-grid">
      {cards.map(card => (
        <a className="tf-card" href={card.href} key={card.href}>
          <strong>
            {card.title}
            <span className={`tf-badge${card.translated ? '' : ' tf-badge-muted'}`}>
              {card.translated ? '번역됨' : '원문'}
            </span>
          </strong>
          <span>{card.desc}</span>
        </a>
      ))}
    </div>
  )
}
