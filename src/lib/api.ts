import { z } from 'zod'
import { SCRIPT_URL } from '../config'

const EntrySchema = z.object({
  id: z.string(),
  address: z.string(),
  lat: z.number(),
  lng: z.number(),
  name: z.string(),
  note: z.string(),
  updatedAt: z.string(),
})

export type Entry = z.infer<typeof EntrySchema>

export type Position = { lat: number; lng: number }

export type EntryInput = {
  address: string
  name: string
  note: string
  /** Manuellt vald position. Utelämnas för att låta servern geokoda adressen. */
  position?: Position
}

const ErrorSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
  message: z.string(),
})

export class ApiError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

const NETWORK_ERROR = 'Kunde inte nå kartan. Kontrollera uppkopplingen och försök igen.'

/** Tolkar ett svar från Apps Script: kastar ApiError vid fel eller oväntat format. */
export function parseResponse<T extends z.ZodType>(json: unknown, schema: T): z.infer<T> {
  const failure = ErrorSchema.safeParse(json)
  if (failure.success) throw new ApiError(failure.data.error, failure.data.message)

  const result = schema.safeParse(json)
  if (!result.success) throw new ApiError('bad_response', 'Oväntat svar från servern.')
  return result.data
}

async function request<T extends z.ZodType>(schema: T, init?: RequestInit, query = ''): Promise<z.infer<T>> {
  let json: unknown
  try {
    // Ingen Content-Type sätts: då blir det text/plain, en "enkel" CORS-förfrågan
    // som Apps Script klarar utan preflight.
    const response = await fetch(SCRIPT_URL + query, init)
    json = await response.json()
  } catch {
    throw new ApiError('network', NETWORK_ERROR)
  }
  return parseResponse(json, schema)
}

function post<T extends z.ZodType>(schema: T, body: Record<string, unknown>) {
  return request(schema, { method: 'POST', body: JSON.stringify(body) })
}

const ListSchema = z.object({ ok: z.literal(true), entries: z.array(EntrySchema) })
const EntryResponseSchema = z.object({ ok: z.literal(true), entry: EntrySchema })
const CreatedSchema = EntryResponseSchema.extend({ token: z.string() })
const OkSchema = z.object({ ok: z.literal(true) })

export async function fetchEntries(eventId: string): Promise<Entry[]> {
  const data = await request(ListSchema, undefined, `?event=${encodeURIComponent(eventId)}`)
  return data.entries
}

export async function createEntry(eventId: string, input: EntryInput): Promise<{ entry: Entry; token: string }> {
  const data = await post(CreatedSchema, { action: 'create', event: eventId, ...input })
  return { entry: data.entry, token: data.token }
}

export async function updateEntry(eventId: string, token: string, input: EntryInput): Promise<Entry> {
  const data = await post(EntryResponseSchema, { action: 'update', event: eventId, token, ...input })
  return data.entry
}

export async function deleteEntry(eventId: string, token: string): Promise<void> {
  await post(OkSchema, { action: 'delete', event: eventId, token })
}

export async function lookupEntry(eventId: string, token: string): Promise<Entry> {
  const data = await post(EntryResponseSchema, { action: 'lookup', event: eventId, token })
  return data.entry
}
