import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HUS, type DateMode } from '../events'
import { ApiError, type EntryInput } from '../lib/api'
import { SignupForm } from './SignupForm'

function renderForm(
  onSubmit: (input: EntryInput) => Promise<void>,
  dateField: { min: string; defaultMode: DateMode } | null = null,
) {
  render(<SignupForm noun={HUS} notePlaceholder="" dateField={dateField} submitLabel="Lägg till på kartan" onSubmit={onSubmit} />)
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
    { address: 'Kummelnäsvägen 12', name: 'Familjen A', note: 'Öppet 17–19', openFrom: '', openUntil: '', date: '', dateTo: '' },
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

describe('when each house picks its own dates', () => {
  const submitWith = async (defaultMode: DateMode, fill: () => Promise<void>) => {
    const submitted: EntryInput[] = []
    renderForm(
      async (input) => {
        submitted.push(input)
      },
      { min: '2026-11-02', defaultMode },
    )
    await userEvent.type(screen.getByLabelText('Adress'), 'Kummelnäsvägen 12')
    await fill()
    await userEvent.click(screen.getByRole('button', { name: 'Lägg till på kartan' }))
    return submitted.map(({ date, dateTo }) => ({ date, dateTo }))
  }

  it('sends no dates for "tills vidare"', async () => {
    expect(await submitWith('ongoing', async () => {})).toEqual([{ date: '', dateTo: '' }])
  })

  it('sends one day', async () => {
    const dates = await submitWith('day', () => userEvent.type(screen.getByLabelText('Datum'), '2026-11-14'))
    expect(dates).toEqual([{ date: '2026-11-14', dateTo: '' }])
  })

  it('sends a period after switching mode', async () => {
    const dates = await submitWith('ongoing', async () => {
      await userEvent.click(screen.getByRole('radio', { name: 'En period' }))
      await userEvent.type(screen.getByLabelText('Från'), '2026-11-14')
      await userEvent.type(screen.getByLabelText('Till och med'), '2026-11-15')
    })
    expect(dates).toEqual([{ date: '2026-11-14', dateTo: '2026-11-15' }])
  })
})
