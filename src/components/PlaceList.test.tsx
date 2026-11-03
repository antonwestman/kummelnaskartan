import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import type { Place, PlaceCategory } from '../events'
import { PlaceList } from './PlaceList'

const backen: Place = { id: 'backen', name: 'Backen', category: 'pulkabacke', lat: 59.33, lng: 18.27, note: 'Flack' }
const lekplatsen: Place = { id: 'lek', name: 'Lekplatsen', category: 'lekplats', lat: 59.34, lng: 18.28 }

function renderList(props: Partial<ComponentProps<typeof PlaceList>> = {}) {
  render(
    <PlaceList
      heading="Platser"
      eventId="ute"
      eventTitle="Ute i Kummelnäs"
      places={[backen]}
      total={1}
      categories={['pulkabacke']}
      category={null}
      onCategoryChange={() => {}}
      userPosition={null}
      onShow={() => {}}
      {...props}
    />,
  )
}

it('lists places with their category and shows the chosen one', async () => {
  const shown: Place[] = []
  renderList({ onShow: (p) => shown.push(p) })

  expect(screen.getByText('Allmän backe · Flack')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /Backen/ }))
  expect(shown).toEqual([backen])
})

it('filters by category when there is more than one', async () => {
  const chosen: (PlaceCategory | null)[] = []
  renderList({
    places: [backen, lekplatsen],
    total: 2,
    categories: ['pulkabacke', 'lekplats'],
    onCategoryChange: (c) => chosen.push(c),
  })

  await userEvent.click(screen.getByRole('button', { name: /Lekplatser/ }))
  expect(chosen).toEqual(['lekplats'])
})

it('shows the warning for a place, e.g. natural ice', () => {
  renderList({ places: [{ ...backen, warning: 'Kolla isen själv.' }] })
  expect(screen.getByText('Kolla isen själv.')).toBeInTheDocument()
})

it('lets visitors tip about a place, or email instead', async () => {
  renderList({ places: [], total: 0, categories: [] })
  expect(screen.getByRole('link', { name: /mejla/ }).getAttribute('href')).toMatch(
    /^mailto:hej@kummelnaskartan\.se\?subject=Tips%20till/,
  )

  await userEvent.click(screen.getByRole('button', { name: 'Tipsa om en plats' }))
  expect(screen.getByText(/Bara allmänna platser/)).toBeInTheDocument()
})

it('asks for a position before a tip can be sent', async () => {
  renderList({ places: [], total: 0, categories: [] })
  await userEvent.click(screen.getByRole('button', { name: 'Tipsa om en plats' }))

  await userEvent.selectOptions(screen.getByLabelText('Vad är det?'), 'grillplats')
  await userEvent.type(screen.getByLabelText('Namn eller kort beskrivning'), 'Grillplats vid stigen')
  await userEvent.click(screen.getByRole('button', { name: 'Skicka tipset' }))

  expect(screen.getByRole('alert')).toHaveTextContent('Tryck på kartan där platsen ligger.')
})
