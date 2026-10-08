import Logo from '../components/Logo.jsx'

const COLUMNS = [
  ['Product', ['Editor', 'Plan check', 'Cost estimate', 'AI assistant']],
  ['Templates', ['3 Marla', '5 Marla', '10 Marla', '1 Kanal']],
  ['Learn', ['Guides', 'Marla and Kanal sizes', 'Grey structure costs']],
  ['Pricing', ['Free plan']]
]

export default function Footer() {
  return (
    <footer className="mx-auto grid max-w-[1280px] grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-[2fr_repeat(4,minmax(0,1fr))]">
      <div className="col-span-2 flex flex-col gap-2.5 md:col-span-1">
        <Logo size={22} />
        <span className="text-[13px] leading-normal text-muted">
          Final Year Project, NUML Faisalabad.
          <br />
          An early planning aid, not a structural engineering tool.
        </span>
      </div>
      {COLUMNS.map(([heading, links]) => (
        <div key={heading} className="flex flex-col gap-2">
          <b className="text-[13px]">{heading}</b>
          {links.map((l) => (
            <a key={l} href="/#product" className="text-[13px] text-muted no-underline hover:text-navy">
              {l}
            </a>
          ))}
        </div>
      ))}
    </footer>
  )
}
