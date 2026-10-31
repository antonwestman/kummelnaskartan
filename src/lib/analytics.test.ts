import { sanitizePath } from './analytics'

it('strips the secret token from edit links', () => {
  expect(sanitizePath('/halloween-2026/andra/0f3c-secret-token')).toBe('/halloween-2026/andra')
  expect(sanitizePath('/halloween-2026/andra/0f3c-secret-token/')).toBe('/halloween-2026/andra')
})

it('leaves other paths untouched', () => {
  expect(sanitizePath('/')).toBe('/')
  expect(sanitizePath('/halloween-2026/')).toBe('/halloween-2026/')
})
