import { Film } from './film/Film'
import { Commands } from './sections/Commands'
import { Evidence } from './sections/Evidence'
import { Footer } from './sections/Footer'
import { Intelligence } from './sections/Intelligence'
import { Invitation } from './sections/Invitation'
import { Mandate } from './sections/Mandate'
import { Nav } from './sections/Nav'
import { Uplink } from './sections/Uplink'

export default function App() {
  return (
    <>
      <a className="skip-link" href="#intelligence">Skip to content</a>
      <Nav sentinelId="intelligence" />
      <main id="main">
        <Film nextId="uplink" />
        <Uplink id="uplink" />
        <Intelligence id="intelligence" />
        <Mandate id="mandate" />
        <Commands id="cli" />
        <Evidence id="evidence" />
        <Invitation id="install" />
      </main>
      <Footer />
    </>
  )
}
