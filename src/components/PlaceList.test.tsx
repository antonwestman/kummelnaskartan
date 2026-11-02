import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Place } from '../events'
import { PlaceList } from './PlaceList'

const backen: Place = { id: 'backen', name: 'Backen', lat: 59.33, lng: 18.27, note: 'Flack, bra för små barn' }

it('lists places and shows the chosen one', async () => {
  const shown: Place[] = []
  render(
    <PlaceList heading="Allmänna backar" places={[backen]} total={1} userPosition={null} onShow={(p) => shown.push(p)} />,
  )

  expect(screen.getByRole('heading', { name: 'Allmänna backar' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /Backen/ }))
  expect(shown).toEqual([backen])
})

it('says so when the search hides every place', () => {
  render(<PlaceList heading="Allmänna backar" places={[]} total={1} userPosition={null} onShow={() => {}} />)
  expect(screen.getByText('Inga allmänna backar matchar.')).toBeInTheDocument()
})

it('renders nothing when the event has no places yet', () => {
  const { container } = render(
    <PlaceList heading="Allmänna backar" places={[]} total={0} userPosition={null} onShow={() => {}} />,
  )
  expect(container).toBeEmptyDOMElement()
})
