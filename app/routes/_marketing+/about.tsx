// About.tsx
import React from 'react'

export default function AboutRoute() {
  return (
    <main className="text-foreground-default bg-background p-6">
      <article className="mx-auto max-w-4xl space-y-8">
        <header className="text-center">
          <h1 className="text-h1 font-bold leading-tight">Discover BandManager</h1>
          <p className="mt-2 text-body-lg">Your go-to tool for seamless band management.</p>
        </header>
        <section className="rounded-lg bg-card p-6 shadow-lg">
          <h2 className="text-h2 font-bold">Streamlined Scheduling</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-body-md">
            <li>Visual calendar integration for blackout and available dates.</li>
            <li>Enabled conflict detection to prevent booking issues.</li>
          </ul>
        </section>
        <section className="rounded-lg bg-card p-6 shadow-lg">
          <h2 className="text-h2 font-bold">Effortless Set List Creation</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-body-md">
            <li>Drag-and-drop set list organizer.</li>
            <li>Archive of past set lists for quick reuse or modification.</li>
          </ul>
        </section>
        <section className="rounded-lg bg-card p-6 shadow-lg">
          <h2 className="text-h2 font-bold">Comprehensive Member Management</h2>
          <p className="mt-4 text-body-lg">
            Keep track of member details, roles, and availability with a user-friendly interface:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-body-md">
            <li>Member profiles with customizable access and roles.</li>
            <li>Integration of member availability into event planning.</li>
          </ul>
        </section>
        <footer className="mt-10 text-center text-body-sm">
          <p>Step up your band's coordination and focus on what you do best — making music with BandManager.</p>
        </footer>
      </article>
    </main>
  )
}
