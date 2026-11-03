import { useId, useState, type FormEvent } from 'react'
import type { DateMode, Noun } from '../events'
import { ApiError, type EntryInput, type Position } from '../lib/api'
import { PositionPicker } from './PositionPicker'

export type SignupValues = {
  address: string
  name: string
  note: string
  openFrom: string
  openUntil: string
  /** "YYYY-MM-DD" eller ''. Se Entry i lib/api.ts. */
  date: string
  dateTo: string
}

type Props = {
  /** Vad grannarna lägger in: hus, backe, loppis. */
  noun: Noun
  notePlaceholder: string
  /**
   * Låt huset välja när det är öppet (tills vidare, en dag eller en period). min = tidigaste tillåtna
   * datum (idag), defaultMode = förval för ett nytt hus. null = inga datum (eventets egen tid gäller).
   */
  dateField: { min: string; defaultMode: DateMode } | null
  /** Utelämnas för ett nytt hus. */
  initialValues?: SignupValues
  submitLabel: string
  /** Ska kasta ApiError vid fel; formuläret visar då felmeddelandet. */
  onSubmit: (input: EntryInput) => Promise<void>
  onCancel?: () => void
}

type Status = { kind: 'idle' } | { kind: 'submitting' } | { kind: 'error'; message: string }

const EMPTY: SignupValues = { address: '', name: '', note: '', openFrom: '', openUntil: '', date: '', dateTo: '' }

const DATE_MODES: { mode: DateMode; label: string }[] = [
  { mode: 'ongoing', label: 'Tills vidare' },
  { mode: 'day', label: 'En dag' },
  { mode: 'period', label: 'En period' },
]

/** Läget för ett hus som redan finns, utifrån dess datum. */
const modeOf = ({ date, dateTo }: SignupValues): DateMode => (!date ? 'ongoing' : dateTo ? 'period' : 'day')

/** Bara de datum som hör till läget skickas, så att ett byte av läge inte lämnar kvar gamla datum. */
function datesFor(mode: DateMode, { date, dateTo }: SignupValues): Pick<SignupValues, 'date' | 'dateTo'> {
  if (mode === 'ongoing') return { date: '', dateTo: '' }
  if (mode === 'day') return { date, dateTo: '' }
  return { date, dateTo }
}

export function SignupForm({ noun, notePlaceholder, dateField, initialValues, submitLabel, onSubmit, onCancel }: Props) {
  const id = useId()
  const [values, setValues] = useState(initialValues ?? EMPTY)
  const [dateMode, setDateMode] = useState<DateMode>(() =>
    initialValues ? modeOf(initialValues) : (dateField?.defaultMode ?? 'ongoing'),
  )
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  // picking = användaren markerar huset själv i stället för att servern geokodar adressen.
  const [picking, setPicking] = useState(false)
  const [position, setPosition] = useState<Position | null>(null)

  const set = (field: keyof SignupValues) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (picking && !position) {
      setStatus({ kind: 'error', message: `Tryck på kartan där ${noun.yours} ligger.` })
      return
    }
    setStatus({ kind: 'submitting' })
    try {
      await onSubmit({
        ...values,
        ...(dateField ? datesFor(dateMode, values) : { date: '', dateTo: '' }),
        ...(picking && position ? { position } : {}),
      })
      setStatus({ kind: 'idle' })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Något gick fel. Försök igen.'
      if (err instanceof ApiError && err.code === 'address_not_found') setPicking(true)
      setStatus({ kind: 'error', message })
    }
  }

  const submitting = status.kind === 'submitting'

  return (
    <form className="signup-form" onSubmit={handleSubmit}>
      <label htmlFor={`${id}-address`}>Adress</label>
      <input
        id={`${id}-address`}
        name="address"
        required
        maxLength={120}
        autoComplete="street-address"
        placeholder="Kummelnäsvägen 12"
        value={values.address}
        onChange={set('address')}
      />

      <label htmlFor={`${id}-name`}>
        Namn <span className="optional">(valfritt)</span>
      </label>
      <input
        id={`${id}-name`}
        name="name"
        maxLength={60}
        autoComplete="family-name"
        placeholder="Familjen Andersson"
        value={values.name}
        onChange={set('name')}
      />

      {dateField && (
        <fieldset className="date-mode">
          <legend>När?</legend>
          <div className="choices">
            {DATE_MODES.map(({ mode, label }) => (
              <label key={mode} className="choice">
                <input
                  type="radio"
                  name={`${id}-date-mode`}
                  checked={dateMode === mode}
                  onChange={() => setDateMode(mode)}
                />
                {label}
              </label>
            ))}
          </div>

          {dateMode === 'day' && (
            <>
              <label htmlFor={`${id}-date`}>Datum</label>
              <input
                id={`${id}-date`}
                type="date"
                required
                min={dateField.min}
                value={values.date}
                onChange={set('date')}
              />
            </>
          )}

          {dateMode === 'period' && (
            <div className="hours">
              <div>
                {/* Ingen min-gräns: en period som redan har börjat ska gå att ändra. */}
                <label htmlFor={`${id}-date`}>Från</label>
                <input id={`${id}-date`} type="date" required value={values.date} onChange={set('date')} />
              </div>
              <div>
                <label htmlFor={`${id}-date-to`}>Till och med</label>
                <input
                  id={`${id}-date-to`}
                  type="date"
                  required
                  min={values.date > dateField.min ? values.date : dateField.min}
                  value={values.dateTo}
                  onChange={set('dateTo')}
                />
              </div>
            </div>
          )}
        </fieldset>
      )}

      <div className="hours">
        <div>
          <label htmlFor={`${id}-from`}>
            Öppet från <span className="optional">(valfritt)</span>
          </label>
          <input id={`${id}-from`} name="openFrom" type="time" value={values.openFrom} onChange={set('openFrom')} />
        </div>
        <div>
          <label htmlFor={`${id}-until`}>
            Öppet till <span className="optional">(valfritt)</span>
          </label>
          <input id={`${id}-until`} name="openUntil" type="time" value={values.openUntil} onChange={set('openUntil')} />
        </div>
      </div>

      <label htmlFor={`${id}-note`}>
        Meddelande <span className="optional">(valfritt)</span>
      </label>
      <input
        id={`${id}-note`}
        name="note"
        maxLength={200}
        placeholder={notePlaceholder}
        value={values.note}
        onChange={set('note')}
      />

      {picking ? (
        <div className="picker">
          <p>Tryck på kartan där {noun.yours} ligger.</p>
          <PositionPicker value={position} onChange={setPosition} />
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setPicking(false)
              setPosition(null)
            }}
          >
            Använd adressen i stället
          </button>
        </div>
      ) : (
        <button type="button" className="link-button" onClick={() => setPicking(true)}>
          Sätt ut {noun.the} på kartan i stället
        </button>
      )}

      <p className="muted small">Adressen syns för alla som besöker sidan.</p>

      {status.kind === 'error' && (
        <p className="form-error" role="alert">
          {status.message}
        </p>
      )}


      <div className="form-actions">
        <button type="submit" className="button primary" disabled={submitting}>
          {submitting ? 'Sparar…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="button" onClick={onCancel} disabled={submitting}>
            Avbryt
          </button>
        )}
      </div>
    </form>
  )
}
