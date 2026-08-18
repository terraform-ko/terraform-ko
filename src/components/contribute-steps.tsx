const steps = [
  {
    title: '이슈 선점',
    desc: '번역할 문서를 GitHub 이슈로 등록하거나 담당자 없는 이슈를 맡습니다.'
  },
  {
    title: '번역 & PR',
    desc: 'STYLE_GUIDE를 따라 번역하고 origin/과 동일한 경로로 PR을 보냅니다.'
  },
  {
    title: '리뷰 & 게시',
    desc: '리뷰 후 병합되면 사이트에 바로 반영됩니다.'
  }
]

export function ContributeSteps() {
  return (
    <div className="tf-card-grid">
      {steps.map((s, i) => (
        <div className="tf-card" key={s.title}>
          <strong>
            {i + 1}. {s.title}
          </strong>
          <span>{s.desc}</span>
        </div>
      ))}
    </div>
  )
}
