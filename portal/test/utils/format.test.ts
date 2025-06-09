import {
  formatBtcAddress,
  formatEvmAddress,
  formatEvmHash,
  formatPastTime,
  formatTVL,
} from 'utils/format'
import { describe, expect, it } from 'vitest'

describe('utils/format', function () {
  describe('formatBtcAddress', function () {
    it('should format a btc address correctly', function () {
      expect(
        formatBtcAddress('bc1qcup4k9q7j0gsjfcv2nqfeu88wjcs9wv0jfuu56'),
      ).toBe('bc1qc...fuu56')
    })
  })

  describe('formatEvmAddress', function () {
    it('should format an evm address correctly', function () {
      expect(
        formatEvmAddress('0x4675C7e5BaAFBFFbca748158bEcBA61ef3b0a263'),
      ).toBe('0x4675...a263')
    })
  })

  describe('formatTxHash', function () {
    it('should format an tx hash correctly', function () {
      expect(
        formatEvmHash(
          '0x5a3f5c2b87c9e4d1e3e0e5c27691d3a04e94f08b3f6a1d4b4d6b96e20b91c8e6',
        ),
      ).toBe('0x5a3f...c8e6')
    })
  })

  describe('formatPastTime', function () {
    const cases = [
      [1, 'en', '1 second ago'],
      [10, 'en', '10 seconds ago'],
      [59, 'en', '59 seconds ago'],
      [60, 'en', '1 minute ago'],
      [119, 'en', '2 minutes ago'],
      [120, 'en', '2 minutes ago'],
      [3600, 'en', '1 hour ago'],
      [7200, 'en', '2 hours ago'],
      [86400, 'en', '1 day ago'],
      [172800, 'en', '2 days ago'],
      [604800, 'en', '1 week ago'],
      [1209600, 'en', '2 weeks ago'],
      [2592000, 'en', '1 month ago'],
      [5184000, 'en', '2 months ago'],
      [31162468, 'en', '1 year ago'],
      [30328739, 'en', '1 year ago'],
      [31536000, 'en', '1 year ago'],
      [63072000, 'en', '2 years ago'],
      [1, 'es', 'hace 1 segundo'],
      [10, 'es', 'hace 10 segundos'],
      [59, 'es', 'hace 59 segundos'],
      [60, 'es', 'hace 1 minuto'],
      [119, 'es', 'hace 2 minutos'],
      [120, 'es', 'hace 2 minutos'],
      [3600, 'es', 'hace 1 hora'],
      [7200, 'es', 'hace 2 horas'],
      [86400, 'es', 'hace 1 día'],
      [172800, 'es', 'hace 2 días'],
      [604800, 'es', 'hace 1 semana'],
      [1209600, 'es', 'hace 2 semanas'],
      [2592000, 'es', 'hace 1 mes'],
      [5184000, 'es', 'hace 2 meses'],
      [31536000, 'es', 'hace 1 año'],
      [63072000, 'es', 'hace 2 años'],
      [1, 'pt', 'há 1 segundo'],
      [10, 'pt', 'há 10 segundos'],
      [59, 'pt', 'há 59 segundos'],
      [60, 'pt', 'há 1 minuto'],
      [119, 'pt', 'há 2 minutos'],
      [120, 'pt', 'há 2 minutos'],
      [3600, 'pt', 'há 1 hora'],
      [7200, 'pt', 'há 2 horas'],
      [86400, 'pt', 'há 1 dia'],
      [172800, 'pt', 'há 2 dias'],
      [604800, 'pt', 'há 1 semana'],
      [1209600, 'pt', 'há 2 semanas'],
      [2592000, 'pt', 'há 1 mês'],
      [5184000, 'pt', 'há 2 meses'],
      [31536000, 'pt', 'há 1 ano'],
      [63072000, 'pt', 'há 2 anos'],
    ]

    it.each(cases)(
      'should return correct relative time for %i seconds in %s locale',
      function (seconds: number, locale: string, expected: string) {
        const result = formatPastTime(seconds, locale)
        expect(result).toBe(expected)
      },
    )
  })

  describe('formatTVL', function () {
    it('should format a number less than one hundred thousand correctly', function () {
      expect(formatTVL(99_999)).toBe('< $100K')
    })

    it('should format a number equal to one hundred thousand correctly', function () {
      expect(formatTVL(100_000)).toBe('$100,000')
    })

    it('should format a number greater than one hundred thousand correctly', function () {
      expect(formatTVL(2500000)).toBe('$2,500,000')
    })

    it('should format a string number less than one hundred thousand correctly', function () {
      expect(formatTVL('99999')).toBe('< $100K')
    })

    it('should format a string number equal to one hundred thousand correctly', function () {
      expect(formatTVL('100000')).toBe('$100,000')
    })

    it('should format a string number greater than one hundred thousand correctly', function () {
      expect(formatTVL('2500000')).toBe('$2,500,000')
    })

    it('should format a string number greater than one hundred thousand without decimals', function () {
      expect(formatTVL('2500000.13')).toBe('$2,500,000')
    })
  })
})
