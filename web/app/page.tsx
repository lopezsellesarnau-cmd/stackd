import {
  Nav,
  Hero,
  Services,
  WorksGrid,
  TrackRecord,
  TechStack,
  Faq,
  Contact,
  Footer,
} from '@/components/sections'

export default function Page() {
  return (
    <>
      <Nav />
      <main id="contenido">
        <Hero />
        <Services />
        <WorksGrid />
        <TrackRecord />
        <TechStack />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
