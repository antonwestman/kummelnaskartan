import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReportForm } from './ReportForm'

it('offers "not mine" for a house and "not public" for a place', () => {
  const { unmount } = render(
    <ReportForm eventId="loppisar" target={{ kind: 'entry', id: 'a', label: 'Kummelnäsvägen 12' }} onClose={() => {}} />,
  )
  expect(screen.getByRole('radio', { name: /Min adress/ })).toBeInTheDocument()
  expect(screen.queryByRole('radio', { name: /inte en allmän plats/ })).not.toBeInTheDocument()
  unmount()

  render(<ReportForm eventId="ute" target={{ kind: 'place', id: 'b', label: 'Grillplatsen' }} onClose={() => {}} />)
  expect(screen.getByRole('radio', { name: /inte en allmän plats/ })).toBeInTheDocument()
  expect(screen.queryByRole('radio', { name: /Min adress/ })).not.toBeInTheDocument()
})

it('asks what is wrong before sending', async () => {
  render(<ReportForm eventId="ute" target={{ kind: 'place', id: 'b', label: 'Grillplatsen' }} onClose={() => {}} />)
  await userEvent.click(screen.getByRole('button', { name: 'Skicka' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Välj vad som är fel.')
})
