import {
  Nav,
  Hero,
  Services,
  WorksGrid,
  Agents,
  Pipeline,
  TrackRecord,
  TechStack,
  Faq,
  Contact,
  Footer,
} from '@/components/sections'

export default function Page() {
  return (
    <div className="ficha-grain min-h-screen">
      <Nav />
      <main id="contenido">
        <Hero />
        <Services />
        <WorksGrid />
        <Agents />
        <Pipeline />
        <TrackRecord />
        <TechStack />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
