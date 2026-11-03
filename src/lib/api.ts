import { z } from 'zod'
import { SCRIPT_URL } from '../config'

const EntrySchema = z.object({
  id: z.string(),
  address: z.string(),
  lat: z.number(),
  lng: z.number(),
  name: z.string(),
  note: z.string(),
  /** Släckt hus: syns grått och sist. Saknas i svar från äldre skript. */
  paused: z.boolean().optional().transform((paused) => paused ?? false),
  /** "HH:MM" eller ''. Saknas i svar från äldre skript. */
  openFrom: z.string().optional().transform((time) => time ?? ''),
  openUntil: z.string().optional().transform((time) => time ?? ''),
  /**
   * När huset är öppet, "YYYY-MM-DD" eller ''. Båda tomma = tills vidare (eller eventets egen tid),
   * bara date = en dag, båda = en period. Saknas i svar från äldre skript.
   */
  date: z.string().optional().transform((date) => date ?? ''),
  dateTo: z.string().optional().transform((date) => date ?? ''),
  updatedAt: z.string(),
})

export type Entry = z.infer<typeof EntrySchema>

export type Position = { lat: number; lng: number }

export type EntryInput = {
  address: string
  name: string
  note: string
  /** "HH:MM" eller tom sträng. */
  openFrom: string
  openUntil: string
  /** "YYYY-MM-DD" eller ''. Se Entry. */
  date: string
  dateTo: string
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

const SignupStateSchema = z.enum(['notYetOpen', 'open', 'closed'])

/** Styrs av EVENTS i apps-script/Code.gs. */
export type Signup =
  | { status: 'open' }
  | { status: 'closed' }
  | { status: 'notYetOpen'; opensAt: string | null }

const SummarySchema = z.object({
  households: z.number(),
  /** Rutornas storlek i meter och i grader. */
  cellMeters: z.number(),
  cellSize: z.object({ lat: z.number(), lng: z.number() }),
  /** Rutor med färre hus än så skickas inte. */
  minPerCell: z.number(),
  /** Rutornas mittpunkt och antal hus. */
  cells: z.array(z.object({ lat: z.number(), lng: z.number(), count: z.number() })),
})

/** Sammanställning för ett event som har passerat sin tid: antal hus och ungefär var, inga adresser. */
export type Summary = z.infer<typeof SummarySchema>

const ListSchema = z.object({
  ok: z.literal(true),
  entries: z.array(EntrySchema),
  // Saknas i äldre versioner av skriptet – då räknas anmälan som öppen.
  signup: SignupStateSchema.optional(),
  signupOpensAt: z.string().nullable().optional(),
  // Saknas i äldre versioner av skriptet och innan eventet har passerat sin tid.
  summary: SummarySchema.nullable().optional(),
})
const EntryResponseSchema = z.object({ ok: z.literal(true), entry: EntrySchema })
const CreatedSchema = EntryResponseSchema.extend({ token: z.string() })
const OkSchema = z.object({ ok: z.literal(true) })

export async function fetchEntries(
  eventId: string,
): Promise<{ entries: Entry[]; signup: Signup; summary: Summary | null }> {
  const data = await request(ListSchema, undefined, `?event=${encodeURIComponent(eventId)}`)
  const signup: Signup =
    data.signup === 'notYetOpen'
      ? { status: 'notYetOpen', opensAt: data.signupOpensAt ?? null }
      : { status: data.signup ?? 'open' }
  return { entries: data.entries, signup, summary: data.summary ?? null }
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

export async function setPaused(eventId: string, token: string, paused: boolean): Promise<Entry> {
  const data = await post(EntryResponseSchema, { action: 'setPaused', event: eventId, token, paused })
  return data.entry
}

/** Tips om en allmän plats. Hamnar i fliken "tips" i Sheetet, syns inte på kartan. */
export type TipInput = {
  /** Kartan tipset kom från, t.ex. "ute". */
  event: string
  category: string
  name: string
  note: string
  lat: number
  lng: number
}

export async function sendTip(tip: TipInput): Promise<void> {
  await post(OkSchema, { action: 'tip', ...tip })
}

export async function lookupEntry(eventId: string, token: string): Promise<Entry> {
  const data = await post(EntryResponseSchema, { action: 'lookup', event: eventId, token })
  return data.entry
}
