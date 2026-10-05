import { Nav, Hero, Services, WorksGrid, Process, Faq, Contact } from '@/components/sections'

export default function Page() {
  return (
    <>
      <Nav />
      <main id="contenido">
        <Hero />
        <WorksGrid />
        <Services />
        <Process />
        <Faq />
        <Contact />
      </main>
    </>
  )
}
