import { pathFromLegacyHash } from './paths'

describe('pathFromLegacyHash', () => {
  it('maps old event and edit links to the new paths', () => {
    expect(pathFromLegacyHash('#/e/halloween-2026')).toBe('/halloween-2026')
    expect(pathFromLegacyHash('#/e/halloween-2026/andra/abc')).toBe('/halloween-2026/andra/abc')
    expect(pathFromLegacyHash('#/')).toBe('/')
  })

  it('ignores ordinary anchors and empty hashes', () => {
    expect(pathFromLegacyHash('')).toBeNull()
    expect(pathFromLegacyHash('#signup')).toBeNull()
  })
})
