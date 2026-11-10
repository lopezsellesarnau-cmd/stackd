import { Nav, Hero, Plans, Work, Quote, Process, Faq, Other, Contact } from '@/components/sections'

export default function Page() {
  return (
    <>
      <Nav />
      <main id="contenido">
        <Hero />
        <Plans />
        <Work />
        <Quote />
        <Process />
        <Faq />
        <Other />
        <Contact />
      </main>
    </>
  )
}
