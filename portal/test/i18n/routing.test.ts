import { resolveLocale } from 'i18n/routing'
import { describe, expect, it } from 'vitest'

describe('i18n/routing', function () {
  describe('resolveLocale', function () {
    it('keeps a supported language', function () {
      expect(resolveLocale('es')).toBe('es')
      expect(resolveLocale('pt')).toBe('pt')
    })

    it('strips the region before matching', function () {
      expect(resolveLocale('es-AR')).toBe('es')
      expect(resolveLocale('pt-BR')).toBe('pt')
      expect(resolveLocale('en-GB')).toBe('en')
    })

    it('matches regardless of case, since the tag is case-insensitive', function () {
      expect(resolveLocale('PT-BR')).toBe('pt')
      expect(resolveLocale('ES')).toBe('es')
      expect(resolveLocale('En-GB')).toBe('en')
    })

    it('falls back to the default for an unsupported language', function () {
      expect(resolveLocale('fr')).toBe('en')
      expect(resolveLocale('de-DE')).toBe('en')
    })

    it('falls back to the default for an empty tag', function () {
      expect(resolveLocale('')).toBe('en')
    })
  })
})
