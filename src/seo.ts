// Importeras även av scripts/prerender.ts (körs direkt i Node), därav .ts-ändelserna.
import type { KummelnasEvent } from './events.ts'
import { SITE_URL, eventPath } from './paths.ts'

export const AREAS = ['Kummelnäs', 'Riset', 'Vikingshill', 'Eriksvik', 'Insjön', 'Kil'] as const

const areaList = `${AREAS.slice(0, -1).join(', ')} och ${AREAS[AREAS.length - 1]}`

export type PageSeo = {
  path: string
  title: string
  description: string
  jsonLd: Record<string, unknown>
}

export const SITE_TITLE = 'Kummelnäskartan – grannarnas karta över Kummelnäs och Boo'

export function siteSeo(): PageSeo {
  const description = `Se var det händer något i Kummelnäs och Saltsjö-Boo i Nacka: Halloween, loppisar och annat. För grannar i ${areaList}.`
  return {
    path: '/',
    title: SITE_TITLE,
    description,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Kummelnäskartan',
      url: `${SITE_URL}/`,
      inLanguage: 'sv',
      description,
    },
  }
}

export function eventSeo(event: KummelnasEvent): PageSeo {
  const year = event.date.slice(0, 4)
  const url = SITE_URL + eventPath(event.id)
  const description = `${event.summary} ${event.dateLabel} i ${areaList}, Saltsjö-Boo.`
  return {
    path: eventPath(event.id),
    title: `${event.title} i Kummelnäs ${year} – Kummelnäskartan`,
    description,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: `${event.title} i Kummelnäs ${year}`,
      startDate: event.date,
      endDate: event.date,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      isAccessibleForFree: true,
      description: event.summary,
      url,
      image: [`${SITE_URL}/og-image.png`],
      location: {
        '@type': 'Place',
        name: 'Kummelnäs, Saltsjö-Boo',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Saltsjö-Boo',
          addressRegion: 'Nacka',
          addressCountry: 'SE',
        },
      },
    },
  }
}
