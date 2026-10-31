/**
 * Körs efter `vite build`. Skriver en färdig HTML-fil per sida så att sökmotorer och
 * länkförhandsvisningar ser rätt titel, beskrivning, strukturerad data och innehåll
 * utan att köra JavaScript. React ersätter innehållet i #root när appen startar.
 *
 *   dist/index.html                  startsidan
 *   dist/<event-id>/index.html       ett event, t.ex. /halloween-2026/
 *   dist/404.html                    allt annat (t.ex. ändringslänkar) – appen tar över
 *   dist/sitemap.xml
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { EVENTS, groupEvents, type KummelnasEvent } from '../src/events.ts'
import { SITE_URL, eventPath } from '../src/paths.ts'
import { eventSeo, siteSeo, type PageSeo } from '../src/seo.ts'

const DIST = 'dist'
const template = readFileSync(`${DIST}/index.html`, 'utf8')

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Byter ut exakt en träff – kastar om mallen inte ser ut som väntat, hellre det än tyst fel. */
function replaceOnce(html: string, pattern: RegExp, replacement: string): string {
  const matches = html.match(new RegExp(pattern.source, 'g'))
  if (matches?.length !== 1) throw new Error(`Hittade ${matches?.length ?? 0} träffar för ${pattern} i index.html`)
  return html.replace(pattern, () => replacement)
}

function renderPage(seo: PageSeo, body: string, options: { noindex?: boolean } = {}): string {
  const url = SITE_URL + seo.path
  const title = escapeHtml(seo.title)
  const description = escapeHtml(seo.description)
  const jsonLd = JSON.stringify(seo.jsonLd).replace(/</g, '\\u003c')

  let html = template
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${title}</title>`)
  html = replaceOnce(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${description}" />`)
  html = replaceOnce(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`)
  html = replaceOnce(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`)
  html = replaceOnce(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${title}" />`)
  html = replaceOnce(
    html,
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${description}" />`,
  )
  const extraHead = [
    options.noindex ? '<meta name="robots" content="noindex" />' : '',
    `<script type="application/ld+json">${jsonLd}</script>`,
  ].join('\n    ')
  html = replaceOnce(html, /<\/head>/, `    ${extraHead}\n  </head>`)
  html = replaceOnce(html, /<div id="root"><\/div>/, `<div id="root">${body}</div>`)
  return html
}

function startBody(now: number): string {
  const list = (title: string, events: KummelnasEvent[]) =>
    events.length === 0
      ? ''
      : `<h2 class="section-label">${title}</h2><ul>${events
          .map((e) => `<li><a href="${eventPath(e.id)}">${escapeHtml(e.title)}</a> – ${escapeHtml(e.dateLabel)}</li>`)
          .join('')}</ul>`
  const { current, past } = groupEvents(EVENTS, now)
  return `<main class="start"><h1>Kummelnäskartan</h1><p class="lead">${escapeHtml(siteSeo().description)}</p>${list('På gång', current)}${list('Tidigare event', past)}</main>`
}

function eventBody(event: KummelnasEvent): string {
  const details = event.details.map((d) => `<p>${escapeHtml(d)}</p>`).join('')
  return `<main class="start"><p><a href="/">Kummelnäskartan</a></p><h1>${escapeHtml(event.title)}</h1><p>${escapeHtml(event.dateLabel)}</p><p class="lead">${escapeHtml(event.summary)}</p>${details}</main>`
}

function write(path: string, content: string) {
  mkdirSync(path.slice(0, path.lastIndexOf('/')), { recursive: true })
  writeFileSync(path, content)
  console.log(`prerender: ${path}`)
}

write(`${DIST}/index.html`, renderPage(siteSeo(), startBody(Date.now())))
write(`${DIST}/404.html`, renderPage(siteSeo(), '', { noindex: true }))
for (const event of EVENTS) {
  write(`${DIST}${eventPath(event.id)}index.html`, renderPage(eventSeo(event), eventBody(event)))
}

const urls = ['/', ...EVENTS.map((e) => eventPath(e.id))]
write(
  `${DIST}/sitemap.xml`,
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`).join('\n')}
</urlset>
`,
)
