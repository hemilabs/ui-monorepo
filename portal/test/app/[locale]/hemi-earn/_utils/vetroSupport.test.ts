import { describe, expect, it } from 'vitest'

import { getVetroSupportUrl } from '../../../../../app/[locale]/hemi-earn/_utils/vetroSupport'

describe('getVetroSupportUrl', function () {
  it('keeps the locales Vetro serves', function () {
    expect(getVetroSupportUrl('en')).toBe('https://app.vetro.org/en/contact')
    expect(getVetroSupportUrl('es')).toBe('https://app.vetro.org/es/contact')
  })

  it('falls back to English for locales Vetro does not serve', function () {
    expect(getVetroSupportUrl('pt')).toBe('https://app.vetro.org/en/contact')
  })
})
