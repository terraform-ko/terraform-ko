const cards = [
  {
    title: '번역 스타일 가이드',
    href: 'https://github.com/terraform-ko/terraform-ko/blob/main/STYLE_GUIDE.md',
    desc: '어조, 형식, 용어 등 번역 시 지켜야 할 규칙을 안내합니다.'
  }
]

export function BestPracticeCards() {
  return (
    <div className="tf-card-grid">
      {cards.map(card => (
        <a className="tf-card" href={card.href} target="_blank" rel="noreferrer" key={card.href}>
          <strong>{card.title}</strong>
          <span>{card.desc}</span>
        </a>
      ))}
    </div>
  )
}
