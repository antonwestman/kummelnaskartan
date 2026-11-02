import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError, type EntryInput } from '../lib/api'
import { SignupForm } from './SignupForm'

function renderForm(
  onSubmit: (input: EntryInput) => Promise<void>,
  dateField: { min: string } | null = null,
) {
  render(<SignupForm notePlaceholder="" dateField={dateField} submitLabel="Lägg till på kartan" onSubmit={onSubmit} />)
}

it('submits address, name and note', async () => {
  const submitted: EntryInput[] = []
  renderForm(async (input) => {
    submitted.push(input)
  })

  await userEvent.type(screen.getByLabelText('Adress'), 'Kummelnäsvägen 12')
  await userEvent.type(screen.getByLabelText(/Namn/), 'Familjen A')
  await userEvent.type(screen.getByLabelText(/Meddelande/), 'Öppet 17–19')
  await userEvent.click(screen.getByRole('button', { name: 'Lägg till på kartan' }))

  expect(submitted).toEqual([
    { address: 'Kummelnäsvägen 12', name: 'Familjen A', note: 'Öppet 17–19', openFrom: '', openUntil: '', date: '' },
  ])
})

it('shows the server error message and keeps the input', async () => {
  renderForm(async () => {
    throw new ApiError('server_error', 'Något gick fel. Försök igen.')
  })

  await userEvent.type(screen.getByLabelText('Adress'), 'Kummelnäsvägen 12')
  await userEvent.click(screen.getByRole('button', { name: 'Lägg till på kartan' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Något gick fel. Försök igen.')
  expect(screen.getByLabelText('Adress')).toHaveValue('Kummelnäsvägen 12')
})

it('requires a pin when the user chooses to mark the house manually', async () => {
  const submitted: EntryInput[] = []
  renderForm(async (input) => {
    submitted.push(input)
  })

  await userEvent.type(screen.getByLabelText('Adress'), 'Stugan bakom ladan')
  await userEvent.click(screen.getByRole('button', { name: 'Sätt ut huset på kartan i stället' }))
  await userEvent.click(screen.getByRole('button', { name: 'Lägg till på kartan' }))

  expect(screen.getByRole('alert')).toHaveTextContent('Tryck på kartan där ditt hus ligger.')
  expect(submitted).toEqual([])
})

it('asks for a date when every house picks its own day', async () => {
  const submitted: EntryInput[] = []
  renderForm(
    async (input) => {
      submitted.push(input)
    },
    { min: '2026-11-02' },
  )

  await userEvent.type(screen.getByLabelText('Adress'), 'Kummelnäsvägen 12')
  await userEvent.type(screen.getByLabelText('Datum'), '2026-11-14')
  await userEvent.click(screen.getByRole('button', { name: 'Lägg till på kartan' }))

  expect(submitted).toEqual([
    { address: 'Kummelnäsvägen 12', name: '', note: '', openFrom: '', openUntil: '', date: '2026-11-14' },
  ])
})
