import {
  formatBtcAddress,
  formatEvmAddress,
  formatEvmHash,
  formatFutureTime,
  formatPastTime,
  formatPercentage,
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
      'should return correct past relative time for %i seconds in %s locale',
      function (seconds: number, locale: string, expected: string) {
        const result = formatPastTime(seconds, locale)
        expect(result).toBe(expected)
      },
    )
  })

  describe('formatFutureTime', function () {
    const cases = [
      [1, 'en', 'in 1 second'],
      [10, 'en', 'in 10 seconds'],
      [59, 'en', 'in 59 seconds'],
      [60, 'en', 'in 1 minute'],
      [119, 'en', 'in 2 minutes'],
      [120, 'en', 'in 2 minutes'],
      [3600, 'en', 'in 1 hour'],
      [7200, 'en', 'in 2 hours'],
      [86400, 'en', 'in 1 day'],
      [172800, 'en', 'in 2 days'],
      [604800, 'en', 'in 1 week'],
      [1209600, 'en', 'in 2 weeks'],
      [2592000, 'en', 'in 1 month'],
      [5184000, 'en', 'in 2 months'],
      [31162468, 'en', 'in 1 year'],
      [30328739, 'en', 'in 1 year'],
      [31536000, 'en', 'in 1 year'],
      [63072000, 'en', 'in 2 years'],
      [1, 'es', 'dentro de 1 segundo'],
      [10, 'es', 'dentro de 10 segundos'],
      [59, 'es', 'dentro de 59 segundos'],
      [60, 'es', 'dentro de 1 minuto'],
      [119, 'es', 'dentro de 2 minutos'],
      [120, 'es', 'dentro de 2 minutos'],
      [3600, 'es', 'dentro de 1 hora'],
      [7200, 'es', 'dentro de 2 horas'],
      [86400, 'es', 'dentro de 1 día'],
      [172800, 'es', 'dentro de 2 días'],
      [604800, 'es', 'dentro de 1 semana'],
      [1209600, 'es', 'dentro de 2 semanas'],
      [2592000, 'es', 'dentro de 1 mes'],
      [5184000, 'es', 'dentro de 2 meses'],
      [31536000, 'es', 'dentro de 1 año'],
      [63072000, 'es', 'dentro de 2 años'],
      [1, 'pt', 'em 1 segundo'],
      [10, 'pt', 'em 10 segundos'],
      [59, 'pt', 'em 59 segundos'],
      [60, 'pt', 'em 1 minuto'],
      [119, 'pt', 'em 2 minutos'],
      [120, 'pt', 'em 2 minutos'],
      [3600, 'pt', 'em 1 hora'],
      [7200, 'pt', 'em 2 horas'],
      [86400, 'pt', 'em 1 dia'],
      [172800, 'pt', 'em 2 dias'],
      [604800, 'pt', 'em 1 semana'],
      [1209600, 'pt', 'em 2 semanas'],
      [2592000, 'pt', 'em 1 mês'],
      [5184000, 'pt', 'em 2 meses'],
      [31536000, 'pt', 'em 1 ano'],
      [63072000, 'pt', 'em 2 anos'],
    ]

    it.each(cases)(
      'should return correct future relative time for %i seconds in %s locale',
      function (seconds: number, locale: string, expected: string) {
        const result = formatFutureTime(seconds, locale)
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

  describe('formatPercentage', function () {
    it('should format integer percentage correctly', function () {
      expect(formatPercentage(50)).toBe('50.00%')
    })

    it('should format decimal percentage correctly', function () {
      expect(formatPercentage(25.5)).toBe('25.50%')
    })

    it('should format percentage with many decimals correctly', function () {
      expect(formatPercentage(33.333333)).toBe('33.33%')
    })

    it('should format zero percentage correctly', function () {
      expect(formatPercentage(0)).toBe('0.00%')
    })

    it('should format percentage greater than 100 correctly', function () {
      expect(formatPercentage(150)).toBe('150.00%')
    })

    it('should format negative percentage correctly', function () {
      expect(formatPercentage(-25.5)).toBe('-25.50%')
    })

    it('should format string percentage correctly', function () {
      expect(formatPercentage('75')).toBe('75.00%')
    })

    it('should format string decimal percentage correctly', function () {
      expect(formatPercentage('12.34')).toBe('12.34%')
    })

    it('should format very small percentage correctly', function () {
      expect(formatPercentage(0.001)).toBe('0.00%')
    })

    it('should format small decimal percentage correctly', function () {
      expect(formatPercentage(0.01)).toBe('0.01%')
    })

    it('should format percentage with high precision correctly', function () {
      expect(formatPercentage(99.999999)).toBe('100.00%')
    })
  })
})
