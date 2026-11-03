import { useId, useState, type FormEvent } from 'react'
import { trackEvent } from '../lib/analytics'
import { ApiError, sendReport, type ReportReason, type ReportTarget } from '../lib/api'

type Props = {
  eventId: string
  target: ReportTarget
  onClose: () => void
}

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; message: string }

/** Orsakerna som passar: ett hus kan vara inlagt utan lov, en plats kan vara privat. */
const REASONS: Record<ReportTarget['kind'], { reason: ReportReason; label: string }[]> = {
  entry: [
    { reason: 'not-mine', label: 'Min adress, men jag har inte lagt in den' },
    { reason: 'wrong', label: 'Informationen stämmer inte' },
    { reason: 'other', label: 'Annat' },
  ],
  place: [
    { reason: 'wrong', label: 'Informationen stämmer inte, eller platsen finns inte längre' },
    { reason: 'not-public', label: 'Det är inte en allmän plats' },
    { reason: 'other', label: 'Annat' },
  ],
}

/** Rapportera något som är fel. Den som sköter kartan får rapporten; inget döljs automatiskt. */
export function ReportForm({ eventId, target, onClose }: Props) {
  const id = useId()
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [comment, setComment] = useState('')
  const [contact, setContact] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  if (status.kind === 'sent') {
    return (
      <div className="report-form" role="status">
        <p>Tack! Den som sköter kartan tittar på det.</p>
        <button type="button" className="button" onClick={onClose}>
          Stäng
        </button>
      </div>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!reason) {
      setStatus({ kind: 'error', message: 'Välj vad som är fel.' })
      return
    }
    setStatus({ kind: 'sending' })
    try {
      await sendReport({ ...target, event: eventId, reason, comment, contact })
      trackEvent('rapport-skickad')
      setStatus({ kind: 'sent' })
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof ApiError ? err.message : 'Något gick fel. Försök igen.' })
    }
  }

  return (
    <form className="signup-form report-form" onSubmit={handleSubmit}>
      <fieldset className="date-mode">
        <legend>Vad är fel med {target.label}?</legend>
        <div className="choices stacked">
          {REASONS[target.kind].map((option) => (
            <label key={option.reason} className="choice">
              <input
                type="radio"
                name={`${id}-reason`}
                checked={reason === option.reason}
                onChange={() => setReason(option.reason)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label htmlFor={`${id}-comment`}>
        Berätta mer {reason !== 'other' && <span className="optional">(valfritt)</span>}
      </label>
      <input
        id={`${id}-comment`}
        required={reason === 'other'}
        maxLength={500}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <label htmlFor={`${id}-contact`}>
        Mejl eller telefon om du vill ha svar <span className="optional">(valfritt)</span>
      </label>
      <input
        id={`${id}-contact`}
        maxLength={120}
        autoComplete="email"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
      />

      <p className="muted small">Rapporten går till den som sköter kartan. Inget tas bort automatiskt.</p>

      {status.kind === 'error' && (
        <p className="form-error" role="alert">
          {status.message}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="button primary" disabled={status.kind === 'sending'}>
          {status.kind === 'sending' ? 'Skickar…' : 'Skicka'}
        </button>
        <button type="button" className="button" onClick={onClose} disabled={status.kind === 'sending'}>
          Avbryt
        </button>
      </div>
    </form>
  )
}
