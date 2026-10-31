import { z } from 'zod'
import { ApiError, parseResponse } from './api'

const schema = z.object({ ok: z.literal(true), value: z.number() })

describe('parseResponse', () => {
  it('returns data for a valid success response', () => {
    expect(parseResponse({ ok: true, value: 1 }, schema)).toEqual({ ok: true, value: 1 })
  })

  it('throws the server error code and message', () => {
    const error = (() => {
      try {
        parseResponse({ ok: false, error: 'address_not_found', message: 'Hittade inte adressen.' }, schema)
      } catch (err) {
        return err
      }
    })()
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ code: 'address_not_found', message: 'Hittade inte adressen.' })
  })

  it('rejects unexpected shapes', () => {
    expect(() => parseResponse('<html>', schema)).toThrow(ApiError)
    expect(() => parseResponse({ ok: true, value: 'x' }, schema)).toThrow('Oväntat svar från servern.')
  })
})
