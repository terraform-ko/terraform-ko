const groups: { heading: string; cards: { title: string; href: string; desc: string; translated?: boolean }[] }[] = [
  {
    heading: '소개',
    cards: [
      { title: 'What is Terraform?', href: '/intro', desc: 'Terraform이 무엇이고 어떤 문제를 해결하는지 소개합니다.' },
      { title: 'Use Cases', href: '/intro/use-cases', desc: 'Terraform으로 만들 수 있는 대표적인 활용 사례를 소개합니다.' },
      {
        title: 'Terraform vs. Alternatives',
        href: '/intro/vs',
        desc: 'Terraform과 다른 도구를 비교합니다.'
      },
      {
        title: 'Phases of Terraform Adoption',
        href: '/intro/phases',
        desc: '조직 규모에 맞게 Terraform 워크플로우를 설계하는 방법을 다룹니다.'
      }
    ]
  },
  {
    heading: '인프라 관리',
    cards: [
      {
        title: 'Configuration Language',
        href: '/language',
        desc: 'Terraform 구성 언어(HCL)로 다양한 프로바이더의 인프라를 기술합니다.',
        translated: false
      },
      {
        title: 'Terraform CLI',
        href: '/cli',
        desc: 'Terraform CLI로 구성·플러그인·인프라·상태를 관리합니다.',
        translated: true
      },
      {
        title: 'CDK for Terraform',
        href: '/cdktf',
        desc: 'TypeScript, Python 등 익숙한 프로그래밍 언어로 Terraform 구성을 작성합니다.'
      }
    ]
  },
  {
    heading: '협업',
    cards: [
      {
        title: 'HCP Terraform',
        href: '/cloud-docs',
        desc: '버전 관리, 상태 공유, 거버넌스 등 팀 단위 협업 기능을 제공합니다.'
      },
      {
        title: 'Terraform Enterprise',
        href: '/terraform-enterprise',
        desc: '엄격한 보안·컴플라이언스가 필요한 조직을 위한 자체 호스팅형 HCP Terraform입니다.'
      }
    ]
  },
  {
    heading: '개발 및 배포',
    cards: [
      {
        title: 'Plugin Development',
        href: '/plugin',
        desc: 'Terraform이 서비스와 연동할 수 있도록 프로바이더를 개발합니다.'
      },
      { title: 'Modules', href: '/language/modules', desc: '재사용 가능한 구성을 모듈로 만듭니다.' },
      {
        title: 'Registry Publishing',
        href: '/registry',
        desc: '프로바이더나 모듈을 Terraform Registry에 공개적으로 배포합니다.'
      }
    ]
  }
]

export function DocHub() {
  return (
    <>
      {groups.map(group => (
        <div key={group.heading}>
          <h2>{group.heading}</h2>
          <div className="tf-card-grid">
            {group.cards.map(card => (
              <a className="tf-card" href={card.href} key={card.href}>
                <strong>
                  {card.title}
                  {card.translated !== undefined && (
                    <span className={`tf-badge${card.translated ? '' : ' tf-badge-muted'}`}>
                      {card.translated ? '번역됨' : '원문'}
                    </span>
                  )}
                </strong>
                <span>{card.desc}</span>
              </a>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
