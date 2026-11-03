import { useId, useState, type FormEvent } from 'react'
import { PLACE_CATEGORIES, PLACE_CATEGORY_IDS, type PlaceCategory } from '../events'
import { useGeolocation } from '../hooks/useGeolocation'
import { trackEvent } from '../lib/analytics'
import { ApiError, sendTip, type Position } from '../lib/api'
import { PositionPicker } from './PositionPicker'

type Props = {
  /** Kartan tipset skickas från, så att den som läser tipset vet var det hör hemma. */
  eventId: string
  /** Förvald kategori, t.ex. pulkabacke på pulkakartan. */
  defaultCategory: PlaceCategory | null
  onClose: () => void
}

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; message: string }

/**
 * Tipsa om en allmän plats: välj vad det är, döp den och sätt ut den på kartan. Kartan börjar på ens
 * egen position om telefonen tillåter det. Tipset syns inte förrän den som sköter kartan har lagt in det.
 */
export function TipForm({ eventId, defaultCategory, onClose }: Props) {
  const id = useId()
  const [category, setCategory] = useState<PlaceCategory | ''>(defaultCategory ?? '')
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  // Det man själv har tryckt ut vinner över ens position.
  const [picked, setPicked] = useState<Position | null>(null)
  const geo = useGeolocation(true, 0)
  const position = picked ?? (geo.status === 'on' ? geo.position : null)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  if (status.kind === 'sent') {
    return (
      <div className="tip-form" role="status">
        <p>Tack för tipset! Det syns på kartan när det har lagts in.</p>
        <button type="button" className="button" onClick={onClose}>
          Stäng
        </button>
      </div>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!position) {
      setStatus({ kind: 'error', message: 'Tryck på kartan där platsen ligger.' })
      return
    }
    if (!category) return
    setStatus({ kind: 'sending' })
    try {
      await sendTip({ event: eventId, category, name, note, lat: position.lat, lng: position.lng })
      trackEvent('tips-skickat')
      setStatus({ kind: 'sent' })
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof ApiError ? err.message : 'Något gick fel. Försök igen.' })
    }
  }

  return (
    <form className="signup-form tip-form" onSubmit={handleSubmit}>
      <p className="muted small">
        Bara allmänna platser som alla får använda, inte privata tomter. Tipset syns inte direkt, det läggs in för
        hand.
      </p>

      <label htmlFor={`${id}-category`}>Vad är det?</label>
      <select
        id={`${id}-category`}
        required
        value={category}
        onChange={(e) => setCategory(PLACE_CATEGORY_IDS.find((c) => c === e.target.value) ?? '')}
      >
        <option value="" disabled>
          Välj
        </option>
        {PLACE_CATEGORY_IDS.map((c) => (
          <option key={c} value={c}>
            {PLACE_CATEGORIES[c].icon} {PLACE_CATEGORIES[c].label}
          </option>
        ))}
      </select>

      <label htmlFor={`${id}-name`}>Namn eller kort beskrivning</label>
      <input
        id={`${id}-name`}
        required
        maxLength={80}
        placeholder="Grillplats vid stigen mot Velamsund"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <label htmlFor={`${id}-note`}>
        Något mer? <span className="optional">(valfritt)</span>
      </label>
      <input
        id={`${id}-note`}
        maxLength={300}
        placeholder="Har vindskydd och ved"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div className="picker">
        <p>
          {picked
            ? 'Platsen är utsatt. Tryck igen för att flytta den.'
            : geo.status === 'on'
              ? 'Kartan visar var du står. Tryck på kartan om platsen ligger någon annanstans.'
              : 'Tryck på kartan där platsen ligger.'}
        </p>
        <PositionPicker value={position} onChange={setPicked} />
      </div>

      {status.kind === 'error' && (
        <p className="form-error" role="alert">
          {status.message}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="button primary" disabled={status.kind === 'sending'}>
          {status.kind === 'sending' ? 'Skickar…' : 'Skicka tipset'}
        </button>
        <button type="button" className="button" onClick={onClose} disabled={status.kind === 'sending'}>
          Avbryt
        </button>
      </div>
    </form>
  )
}
