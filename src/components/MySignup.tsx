import { useState } from 'react'
import type { KummelnasEvent } from '../events'
import { ApiError, createEntry, deleteEntry, updateEntry, type Entry } from '../lib/api'
import { editLink, type MyEntryRef } from '../lib/myEntry'
import { trackEvent } from '../lib/analytics'
import { SignupForm } from './SignupForm'

type Props = {
  event: KummelnasEvent
  myRef: MyEntryRef | null
  myEntry: Entry | undefined
  entriesLoaded: boolean
  onSaved: (entry: Entry, token: string) => void
  onDeleted: (id: string) => void
}

export function MySignup({ event, myRef, myEntry, entriesLoaded, onSaved, onDeleted }: Props) {
  const [editing, setEditing] = useState(false)

  if (!entriesLoaded) {
    return (
      <>
        <h2 id="signup-heading">Lägg till ditt hus</h2>
        <p className="muted">Laddar…</p>
      </>
    )
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

  if (editing) {
    return (
      <>
        <h2 id="signup-heading">Ändra</h2>
        <SignupForm
          notePlaceholder={event.notePlaceholder}
          initialValues={{ address: myEntry.address, name: myEntry.name, note: myEntry.note }}
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
      onEdit={() => setEditing(true)}
      onDeleted={() => onDeleted(myEntry.id)}
    />
  )
}

function MyEntrySummary({
  event,
  entry,
  token,
  onEdit,
  onDeleted,
}: {
  event: KummelnasEvent
  entry: Entry
  token: string
  onEdit: () => void
  onDeleted: () => void
}) {
  const [deleteState, setDeleteState] = useState<
    { kind: 'idle' } | { kind: 'deleting' } | { kind: 'error'; message: string }
  >({ kind: 'idle' })
  const [copied, setCopied] = useState(false)
  const link = editLink(event.id, token)

  const handleDelete = async () => {
    if (!window.confirm('Ta bort ditt hus från kartan?')) return
    setDeleteState({ kind: 'deleting' })
    try {
      await deleteEntry(event.id, token)
      trackEvent('hus-borttaget')
      onDeleted()
    } catch (err) {
      setDeleteState({
        kind: 'error',
        message: err instanceof ApiError ? err.message : 'Kunde inte ta bort. Försök igen.',
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
      <h2 id="signup-heading">Du är med på kartan</h2>
      <p className="my-entry">
        <strong>{entry.address}</strong>
        {(entry.name || entry.note) && <span className="muted">{[entry.name, entry.note].filter(Boolean).join(' · ')}</span>}
      </p>
      <div className="form-actions">
        <button type="button" className="button" onClick={onEdit}>
          Ändra
        </button>
        <button
          type="button"
          className="button danger"
          onClick={handleDelete}
          disabled={deleteState.kind === 'deleting'}
        >
          {deleteState.kind === 'deleting' ? 'Tar bort…' : 'Ta bort'}
        </button>
      </div>
      {deleteState.kind === 'error' && (
        <p className="form-error" role="alert">
          {deleteState.message}
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
