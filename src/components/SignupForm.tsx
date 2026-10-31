import { useId, useState, type FormEvent } from 'react'
import { ApiError, type EntryInput, type Position } from '../lib/api'
import { PositionPicker } from './PositionPicker'

export type SignupValues = { address: string; name: string; note: string }

type Props = {
  notePlaceholder: string
  initialValues?: SignupValues
  submitLabel: string
  /** Ska kasta ApiError vid fel; formuläret visar då felmeddelandet. */
  onSubmit: (input: EntryInput) => Promise<void>
  onCancel?: () => void
}

type Status = { kind: 'idle' } | { kind: 'submitting' } | { kind: 'error'; message: string }

const EMPTY: SignupValues = { address: '', name: '', note: '' }

export function SignupForm({ notePlaceholder, initialValues = EMPTY, submitLabel, onSubmit, onCancel }: Props) {
  const id = useId()
  const [values, setValues] = useState(initialValues)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  // picking = användaren markerar huset själv i stället för att servern geokodar adressen.
  const [picking, setPicking] = useState(false)
  const [position, setPosition] = useState<Position | null>(null)

  const set = (field: keyof SignupValues) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (picking && !position) {
      setStatus({ kind: 'error', message: 'Tryck på kartan där ditt hus ligger.' })
      return
    }
    setStatus({ kind: 'submitting' })
    try {
      await onSubmit({ ...values, ...(picking && position ? { position } : {}) })
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
          <p>Tryck på kartan där ditt hus ligger.</p>
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
          Sätt ut huset på kartan i stället
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
