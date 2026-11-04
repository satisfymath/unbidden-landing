import { Film } from './film/Film'
import { useAnchorJump } from './hooks/useAnchorJump'
import { Commands } from './sections/Commands'
import { Evidence } from './sections/Evidence'
import { Footer } from './sections/Footer'
import { Intelligence } from './sections/Intelligence'
import { Invitation } from './sections/Invitation'
import { Mandate } from './sections/Mandate'
import { Nav } from './sections/Nav'

export default function App() {
  useAnchorJump()
  return (
    <>
      <a className="skip-link" href="#how">Skip to content</a>
      <Nav />
      <main id="main">
        <Film nextId="how" />
        <Intelligence id="how" />
        <Evidence id="evidence" />
        <Mandate id="control" />
        <Commands id="cli" />
        <Invitation id="install" />
      </main>
      <Footer />
    </>
  )
}
