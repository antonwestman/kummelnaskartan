import { useState } from 'react'
import type { KummelnasEvent } from '../events'
import { ApiError, createEntry, deleteEntry, updateEntry, type Entry } from '../lib/api'
import { editLink, type MyEntryRef } from '../lib/myEntry'
import { SignupForm } from './SignupForm'

type Props = {
  event: KummelnasEvent
  myRef: MyEntryRef | null
  myEntry: Entry | undefined
  entriesLoaded: boolean
  onSaved: (entry: Entry, token: string) => void
  onDeleted: (id: string) => void
  onForget: () => void
}

export function MySignup({ event, myRef, myEntry, entriesLoaded, onSaved, onDeleted, onForget }: Props) {
  const [editing, setEditing] = useState(false)

  if (!entriesLoaded) {
    return (
      <>
        <h2 id="signup-heading">Anmäl ditt hus</h2>
        <p className="muted">Laddar…</p>
      </>
    )
  }

  if (!myRef || !myEntry) {
    return (
      <>
        <h2 id="signup-heading">Anmäl ditt hus</h2>
        {myRef && <p className="muted">Din tidigare anmälan finns inte längre. Du kan anmäla dig igen.</p>}
        <SignupForm
          emoji={event.emoji}
          notePlaceholder={event.notePlaceholder}
          submitLabel="Lägg till på kartan"
          onSubmit={async (input) => {
            const { entry, token } = await createEntry(event.id, input)
            onSaved(entry, token)
          }}
        />
      </>
    )
  }

  if (editing) {
    return (
      <>
        <h2 id="signup-heading">Ändra din anmälan</h2>
        <SignupForm
          emoji={event.emoji}
          notePlaceholder={event.notePlaceholder}
          initialValues={{ address: myEntry.address, name: myEntry.name, note: myEntry.note }}
          submitLabel="Spara ändringar"
          onSubmit={async (input) => {
            const entry = await updateEntry(event.id, myRef.token, input)
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
      onForget={onForget}
    />
  )
}

function MyEntrySummary({
  event,
  entry,
  token,
  onEdit,
  onDeleted,
  onForget,
}: {
  event: KummelnasEvent
  entry: Entry
  token: string
  onEdit: () => void
  onDeleted: () => void
  onForget: () => void
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
        await navigator.share({ title: 'Ändra min anmälan – Kummelnäskartan', url: link })
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
      <h2 id="signup-heading">Du är med på kartan {event.emoji}</h2>
      <p className="my-entry">
        <strong>{entry.address}</strong>
        {entry.name && <> · {entry.name}</>}
        {entry.note && <span className="entry-note">{entry.note}</span>}
      </p>
      <div className="form-actions">
        <button type="button" className="button secondary" onClick={onEdit}>
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
        <summary>Ändra från en annan telefon eller dator</summary>
        <p className="muted small">
          Din anmälan är sparad i den här webbläsaren. Spara länken nedan om du vill kunna ändra den någon annanstans.
          Dela den inte med andra.
        </p>
        <input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Ändringslänk" />
        <div className="form-actions">
          <button type="button" className="button secondary small" onClick={handleShareLink}>
            {copied ? 'Kopierad!' : 'Spara/dela länk'}
          </button>
          <button type="button" className="link-button" onClick={onForget}>
            Glöm anmälan på den här enheten
          </button>
        </div>
      </details>
    </>
  )
}
