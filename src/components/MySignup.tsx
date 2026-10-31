import { useState } from 'react'
import type { KummelnasEvent } from '../events'
import { ApiError, createEntry, deleteEntry, setPaused, updateEntry, type Entry, type Signup } from '../lib/api'
import { editLink, type MyEntryRef } from '../lib/myEntry'
import { trackEvent } from '../lib/analytics'
import { displayAddress } from '../lib/address'
import { EntryDetails } from './EntryList'
import { SignupForm } from './SignupForm'

type Props = {
  event: KummelnasEvent
  myRef: MyEntryRef | null
  myEntry: Entry | undefined
  /** null = laddar fortfarande. */
  signup: Signup | null
  onSaved: (entry: Entry, token: string) => void
  onDeleted: (id: string) => void
}

export function MySignup({ event, myRef, myEntry, signup, onSaved, onDeleted }: Props) {
  const [editing, setEditing] = useState(false)

  if (!signup) {
    return (
      <>
        <h2 id="signup-heading">Lägg till ditt hus</h2>
        <p className="muted">Laddar…</p>
      </>
    )
  }

  const open = signup.status === 'open'

  if ((!myRef || !myEntry) && !open) {
    return <SignupUnavailable signup={signup} />
  }

  if (!myRef || !myEntry) {
    return (
      <>
        <h2 id="signup-heading">Lägg till ditt hus</h2>
        {myRef && <p className="muted">Ditt hus finns inte längre på kartan.</p>}
        <SignupForm
          notePlaceholder={event.notePlaceholder}
          submitLabel="Lägg till på kartan"
          onSubmit={async (input) => {
            const { entry, token } = await createEntry(event.id, input)
            trackEvent('hus-tillagt')
            onSaved(entry, token)
          }}
        />
      </>
    )
  }

  if (editing && open) {
    return (
      <>
        <h2 id="signup-heading">Ändra</h2>
        <SignupForm
          notePlaceholder={event.notePlaceholder}
          initialValues={{
            address: myEntry.address,
            name: myEntry.name,
            note: myEntry.note,
            openFrom: myEntry.openFrom,
            openUntil: myEntry.openUntil,
          }}
          submitLabel="Spara ändringar"
          onSubmit={async (input) => {
            const entry = await updateEntry(event.id, myRef.token, input)
            trackEvent('hus-andrat')
            onSaved(entry, myRef.token)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      </>
    )
  }

  return (
    <MyEntrySummary
      event={event}
      entry={myEntry}
      token={myRef.token}
      onEdit={open ? () => setEditing(true) : null}
      onUpdated={(entry) => onSaved(entry, myRef.token)}
      onDeleted={() => onDeleted(myEntry.id)}
    />
  )
}

const formatOpensAt = (iso: string) =>
  new Date(iso).toLocaleString('sv-SE', {
    timeZone: 'Europe/Stockholm',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

function SignupUnavailable({ signup }: { signup: Exclude<Signup, { status: 'open' }> }) {
  if (signup.status === 'closed') {
    return (
      <>
        <h2 id="signup-heading">Anmälan är stängd</h2>
        <p className="muted">Det går inte längre att lägga till hus för det här eventet.</p>
      </>
    )
  }
  return (
    <>
      <h2 id="signup-heading">Lägg till ditt hus</h2>
      <p className="muted">
        {signup.opensAt ? `Det går att lägga till hus från ${formatOpensAt(signup.opensAt)}.` : 'Det går att lägga till hus snart.'}
      </p>
    </>
  )
}

function MyEntrySummary({
  event,
  entry,
  token,
  onEdit,
  onUpdated,
  onDeleted,
}: {
  event: KummelnasEvent
  entry: Entry
  token: string
  /** null när anmälan är stängd – då går det bara att ta bort. */
  onEdit: (() => void) | null
  onUpdated: (entry: Entry) => void
  onDeleted: () => void
}) {
  const [actionState, setActionState] = useState<
    { kind: 'idle' } | { kind: 'busy'; action: 'delete' | 'pause' } | { kind: 'error'; message: string }
  >({ kind: 'idle' })
  const busy = actionState.kind === 'busy'
  const [copied, setCopied] = useState(false)
  const link = editLink(event.id, token)

  const handleDelete = async () => {
    if (!window.confirm('Ta bort ditt hus från kartan?')) return
    setActionState({ kind: 'busy', action: 'delete' })
    try {
      await deleteEntry(event.id, token)
      trackEvent('hus-borttaget')
      onDeleted()
    } catch (err) {
      setActionState({
        kind: 'error',
        message: err instanceof ApiError ? err.message : 'Kunde inte ta bort. Försök igen.',
      })
    }
  }

  const handleTogglePaused = async () => {
    setActionState({ kind: 'busy', action: 'pause' })
    try {
      const updated = await setPaused(event.id, token, !entry.paused)
      trackEvent(updated.paused ? 'hus-slackt' : 'hus-tant')
      onUpdated(updated)
      setActionState({ kind: 'idle' })
    } catch (err) {
      setActionState({
        kind: 'error',
        message: err instanceof ApiError ? err.message : 'Kunde inte spara. Försök igen.',
      })
    }
  }

  const handleShareLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Ändra mitt hus på Kummelnäskartan', url: link })
      } else {
        await navigator.clipboard.writeText(link)
        setCopied(true)
      }
    } catch {
      // Användaren avbröt delning – inget att göra.
    }
  }

  return (
    <>
      <h2 id="signup-heading">{entry.paused ? 'Ditt hus är släckt' : 'Du är med på kartan'}</h2>
      <p className="my-entry">
        <strong>{displayAddress(entry.address)}</strong>
        <EntryDetails entry={entry} />
      </p>
      <p className="muted small">
        {entry.paused
          ? 'Huset syns grått på kartan så att ingen knackar på. Tänd det igen när du vill.'
          : 'Slut på godis eller inte hemma? Släck huset så syns det grått på kartan.'}
      </p>
      <div className="form-actions">
        <button type="button" className={`button${entry.paused ? ' primary' : ''}`} onClick={handleTogglePaused} disabled={busy}>
          {actionState.kind === 'busy' && actionState.action === 'pause'
            ? 'Sparar…'
            : entry.paused
              ? 'Tänd igen'
              : 'Släck huset'}
        </button>
        {onEdit && (
          <button type="button" className="button" onClick={onEdit}>
            Ändra
          </button>
        )}
        <button
          type="button"
          className="button danger"
          onClick={handleDelete}
          disabled={busy}
        >
          {actionState.kind === 'busy' && actionState.action === 'delete' ? 'Tar bort…' : 'Ta bort'}
        </button>
      </div>
      {actionState.kind === 'error' && (
        <p className="form-error" role="alert">
          {actionState.message}
        </p>
      )}
      <details className="edit-link">
        <summary>Ändra från en annan telefon</summary>
        <p className="muted small">
          Den här telefonen kommer ihåg ditt hus. Spara länken om du vill kunna ändra från en annan. Dela den inte, den
          som har länken kan ändra.
        </p>
        <input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Ändringslänk" />
        <div className="form-actions">
          <button type="button" className="button small" onClick={handleShareLink}>
            {copied ? 'Kopierad' : 'Dela länken'}
          </button>
        </div>
      </details>
    </>
  )
}
