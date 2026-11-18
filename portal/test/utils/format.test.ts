import Big from 'big.js'
import {
  createFormatter,
  formatBtcAddress,
  formatBtcHash,
  formatEvmAddress,
  formatEvmHash,
  roundNumber,
  smallestFormattedNumber,
} from 'utils/format'
import { describe, expect, it } from 'vitest'

const englishFormatter = createFormatter('en')
const portugueseFormatter = createFormatter('pt')
const spanishFormatter = createFormatter('es')

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

  describe('formatBtcHash', function () {
    it('should format a btc tx hash correctly', function () {
      expect(
        formatBtcHash(
          '5a3f5c2b87c9e4d1e3e0e5c27691d3a04e94f08b3f6a1d4b4d6b96e20b91c8e6',
        ),
      ).toBe('5a3f...c8e6')
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
        const result = createFormatter(locale).formatPastTime(seconds)
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
        const result = createFormatter(locale).formatFutureTime(seconds)
        expect(result).toBe(expected)
      },
    )
  })

  describe('formatDuration', function () {
    it('uses the largest matching duration unit', function () {
      expect(createFormatter('en').formatDuration(3600)).toBe('1 hour')
    })

    it('formats the duration unit using the selected locale', function () {
      expect(createFormatter('es').formatDuration(3600)).toBe('1 hora')
      expect(createFormatter('pt').formatDuration(3600)).toBe('1 hora')
    })
  })

  describe('formatApyDisplay', function () {
    it('flags a tiny positive apy instead of rounding it to zero', function () {
      expect(englishFormatter.formatApyDisplay(0.005)).toBe('< 0.01%')
    })

    it('flags a tiny negative apy the same way', function () {
      expect(englishFormatter.formatApyDisplay(-0.005)).toBe('< -0.01%')
    })

    it('reads zero as zero, not as less than a hundredth', function () {
      expect(englishFormatter.formatApyDisplay(0)).toBe('0.00%')
    })

    it('formats a negative apy beyond the threshold', function () {
      expect(englishFormatter.formatApyDisplay(-5.25)).toBe('-5.25%')
    })

    it('formats the threshold itself', function () {
      expect(englishFormatter.formatApyDisplay(0.01)).toBe('0.01%')
    })

    it('formats a larger apy', function () {
      expect(englishFormatter.formatApyDisplay(5.25)).toBe('5.25%')
    })

    it('follows the locale separators, also in the threshold labels', function () {
      expect(spanishFormatter.formatApyDisplay(5.25)).toBe('5,25%')
      expect(spanishFormatter.formatApyDisplay(0.005)).toBe('< 0,01%')
      expect(portugueseFormatter.formatApyDisplay(-0.005)).toBe('< -0,01%')
    })
  })

  describe('formatFiatAmount', function () {
    it('shows two decimals', function () {
      expect(englishFormatter.formatFiatAmount(12.345)).toBe('$12.35')
    })

    it('flags anything under a cent instead of rounding it to zero', function () {
      expect(englishFormatter.formatFiatAmount(0.0049)).toBe('< $0.01')
    })

    it('shows a cent as a cent', function () {
      expect(englishFormatter.formatFiatAmount(0.01)).toBe('$0.01')
    })

    it('reads zero as zero, not as less than a cent', function () {
      expect(englishFormatter.formatFiatAmount(0)).toBe('$0.00')
    })

    it('groups thousands', function () {
      expect(englishFormatter.formatFiatAmount('1234567')).toBe('$1,234,567.00')
    })

    it('follows the locale separators, also in the threshold label', function () {
      expect(spanishFormatter.formatFiatAmount('1234567')).toBe('$1.234.567,00')
      expect(portugueseFormatter.formatFiatAmount(0.0049)).toBe('< $0,01')
    })
  })

  describe('formatTVL', function () {
    it('should format a number less than one hundred thousand correctly', function () {
      expect(englishFormatter.formatTVL(99_999)).toBe('< $100K')
    })

    it('should format a number equal to one hundred thousand correctly', function () {
      expect(englishFormatter.formatTVL(100_000)).toBe('$100,000')
    })

    it('should format a number greater than one hundred thousand correctly', function () {
      expect(englishFormatter.formatTVL(2500000)).toBe('$2,500,000')
    })

    it('should format a string number less than one hundred thousand correctly', function () {
      expect(englishFormatter.formatTVL('99999')).toBe('< $100K')
    })

    it('should format a string number equal to one hundred thousand correctly', function () {
      expect(englishFormatter.formatTVL('100000')).toBe('$100,000')
    })

    it('should format a string number greater than one hundred thousand correctly', function () {
      expect(englishFormatter.formatTVL('2500000')).toBe('$2,500,000')
    })

    it('should format a string number greater than one hundred thousand without decimals', function () {
      expect(englishFormatter.formatTVL('2500000.13')).toBe('$2,500,000')
    })

    it('should follow the locale, also in the threshold label', function () {
      expect(spanishFormatter.formatTVL(2500000)).toBe('$2.500.000')
      expect(portugueseFormatter.formatTVL(99_999)).toBe('< $100\u00a0mil')
    })
  })

  describe('formatCompactFiat', function () {
    // Intl.NumberFormat separates the number and the compact suffix with a
    // non-breaking space (U+00A0) in es/pt locales — not a regular ASCII
    // space. Use an explicit constant so the expectations are unambiguous.
    const nbsp = '\u00A0'

    it('should format a small number in en locale', function () {
      expect(englishFormatter.formatCompactFiat(999)).toBe('$999')
    })

    it('should format thousands in en locale', function () {
      expect(englishFormatter.formatCompactFiat(1500)).toBe('$1.5K')
    })

    it('should format millions in en locale', function () {
      expect(englishFormatter.formatCompactFiat(420_000_000)).toBe('$420M')
    })

    it('should format billions in en locale', function () {
      expect(englishFormatter.formatCompactFiat(1_200_000_000)).toBe('$1.2B')
    })

    it('should format zero in en locale', function () {
      expect(englishFormatter.formatCompactFiat(0)).toBe('$0')
    })

    it('should honor maximumFractionDigits when provided', function () {
      expect(englishFormatter.formatCompactFiat(420_170_000, 2)).toBe(
        '$420.17M',
      )
    })

    it('should format millions in es locale with trailing space', function () {
      expect(spanishFormatter.formatCompactFiat(420_000_000)).toBe(
        `$420${nbsp}M`,
      )
    })

    it('should format millions in es locale with comma decimal', function () {
      expect(spanishFormatter.formatCompactFiat(420_170_000, 2)).toBe(
        `$420,17${nbsp}M`,
      )
    })

    it('should format millions in pt locale using "mi" suffix', function () {
      expect(portugueseFormatter.formatCompactFiat(420_000_000)).toBe(
        `$420${nbsp}mi`,
      )
    })

    it('should group thousands of millions in es locale', function () {
      expect(spanishFormatter.formatCompactFiat(2_065_440_000, 2)).toBe(
        `$2.065,44${nbsp}M`,
      )
    })
  })

  describe('formatCompactFiatParts', function () {
    const nbsp = '\u00A0'

    it('should split number and suffix for millions in en locale', function () {
      expect(englishFormatter.formatCompactFiatParts(420_170_000)).toEqual({
        number: '420.17',
        suffix: 'M',
      })
    })

    it('should split number and suffix for billions in en locale', function () {
      expect(englishFormatter.formatCompactFiatParts(1_234_567_890)).toEqual({
        number: '1.23',
        suffix: 'B',
      })
    })

    it('should return an empty suffix for small numbers', function () {
      expect(englishFormatter.formatCompactFiatParts(999)).toEqual({
        number: '999',
        suffix: '',
      })
    })

    it('should return an empty suffix for zero', function () {
      expect(englishFormatter.formatCompactFiatParts(0)).toEqual({
        number: '0',
        suffix: '',
      })
    })

    it('should honor an explicit maximumFractionDigits', function () {
      expect(englishFormatter.formatCompactFiatParts(420_170_000, 0)).toEqual({
        number: '420',
        suffix: 'M',
      })
    })

    it('should use comma decimals in es locale', function () {
      expect(spanishFormatter.formatCompactFiatParts(420_170_000)).toEqual({
        number: `420,17${nbsp}`,
        suffix: 'M',
      })
    })

    it('should use "mi" suffix in pt locale', function () {
      expect(portugueseFormatter.formatCompactFiatParts(420_170_000)).toEqual({
        number: `420,17${nbsp}`,
        suffix: 'mi',
      })
    })

    it('should group thousands of millions in es locale', function () {
      expect(spanishFormatter.formatCompactFiatParts(2_065_440_000)).toEqual({
        number: `2.065,44${nbsp}`,
        suffix: 'M',
      })
    })
  })

  describe('formatShortDate', function () {
    // Use local-time constructor so the formatted day is stable regardless of
    // the test runner's timezone.
    const march15 = new Date(2026, 2, 15)
    const december5 = new Date(2026, 11, 5)

    it('should format a date in en locale', function () {
      expect(englishFormatter.formatShortDate(march15)).toBe('Mar 15')
    })

    it('should format a date in es locale', function () {
      expect(spanishFormatter.formatShortDate(march15)).toBe('15 mar')
    })

    it('should format a date in pt locale', function () {
      expect(portugueseFormatter.formatShortDate(march15)).toBe('15 de mar.')
    })

    it('should zero-pad single-digit days', function () {
      expect(englishFormatter.formatShortDate(december5)).toBe('Dec 05')
    })

    it('should format in the given time zone', function () {
      // A UTC-midnight instant falls on the previous day in negative-offset
      // zones; passing 'UTC' keeps it on Jun 25 regardless of the runner's tz.
      const utcMidnight = new Date('2026-06-25T00:00:00Z')
      expect(englishFormatter.formatShortDate(utcMidnight, 'UTC')).toBe(
        'Jun 25',
      )
      expect(
        englishFormatter.formatShortDate(utcMidnight, 'America/New_York'),
      ).toBe('Jun 24')
    })
  })

  describe('formatShortDateWithYear', function () {
    const march15 = new Date(2026, 2, 15)

    it('should format a date in en locale', function () {
      expect(englishFormatter.formatShortDateWithYear(march15)).toBe(
        'Mar 15, 2026',
      )
    })

    it('should format a date in es locale', function () {
      expect(spanishFormatter.formatShortDateWithYear(march15)).toBe(
        '15 mar 2026',
      )
    })

    it('should format a date in pt locale', function () {
      expect(portugueseFormatter.formatShortDateWithYear(march15)).toBe(
        '15 de mar. de 2026',
      )
    })

    it('should zero-pad single-digit days', function () {
      expect(
        englishFormatter.formatShortDateWithYear(new Date(2026, 11, 5)),
      ).toBe('Dec 05, 2026')
    })

    it('should carry the year across a time zone boundary', function () {
      const newYearUtc = new Date('2027-01-01T00:00:00Z')
      expect(englishFormatter.formatShortDateWithYear(newYearUtc, 'UTC')).toBe(
        'Jan 01, 2027',
      )
      expect(
        englishFormatter.formatShortDateWithYear(
          newYearUtc,
          'America/New_York',
        ),
      ).toBe('Dec 31, 2026')
    })
  })

  describe('formatDate', function () {
    it('should format in the given time zone', function () {
      const utcMidnight = new Date('2026-06-25T00:00:00Z')
      expect(englishFormatter.formatDate(utcMidnight, 'UTC')).toBe('06/25/2026')
      expect(englishFormatter.formatDate(utcMidnight, 'America/New_York')).toBe(
        '06/24/2026',
      )
    })
  })

  describe('formatNumber', function () {
    it('should use the en locale separators', function () {
      expect(englishFormatter.formatNumber(1234567)).toBe('1,234,567')
    })

    it('should follow the locale separators', function () {
      expect(portugueseFormatter.formatNumber(1234567)).toBe('1.234.567')
      expect(spanishFormatter.formatNumber(1234567)).toBe('1.234.567')
      expect(spanishFormatter.formatNumber(1234)).toBe('1.234')
      expect(portugueseFormatter.formatNumber(1234.5678)).toBe('1.234,56')
    })

    it('should round an amount below six decimals down to zero', function () {
      expect(englishFormatter.formatNumber('0.00000012')).toBe('0.000000')
    })
  })

  describe('roundNumber', function () {
    it('should round down to six significant digits without formatting', function () {
      expect(roundNumber('1234.5678')).toBe('1234.56')
    })

    it('should keep an amount that needs no rounding intact', function () {
      expect(roundNumber('0.5')).toBe('0.5')
    })
  })

  describe('smallestFormattedNumber', function () {
    it('should be the smallest amount formatNumber keeps intact', function () {
      expect(englishFormatter.formatNumber(smallestFormattedNumber)).toBe(
        smallestFormattedNumber,
      )
    })

    it('should be the last step before formatNumber loses every digit', function () {
      const below = Big(smallestFormattedNumber).div(10).toFixed()
      expect(englishFormatter.formatNumber(below)).not.toMatch(/[1-9]/)
    })
  })

  describe('formatPercentage', function () {
    it('should format integer percentage correctly', function () {
      expect(englishFormatter.formatPercentage(50)).toBe('50.00%')
    })

    it('should format decimal percentage correctly', function () {
      expect(englishFormatter.formatPercentage(25.5)).toBe('25.50%')
    })

    it('should format percentage with many decimals correctly', function () {
      expect(englishFormatter.formatPercentage(33.333333)).toBe('33.33%')
    })

    it('should format zero percentage correctly', function () {
      expect(englishFormatter.formatPercentage(0)).toBe('0.00%')
    })

    it('should format percentage greater than 100 correctly', function () {
      expect(englishFormatter.formatPercentage(150)).toBe('150.00%')
    })

    it('should format negative percentage correctly', function () {
      expect(englishFormatter.formatPercentage(-25.5)).toBe('-25.50%')
    })

    it('should format string percentage correctly', function () {
      expect(englishFormatter.formatPercentage('75')).toBe('75.00%')
    })

    it('should format string decimal percentage correctly', function () {
      expect(englishFormatter.formatPercentage('12.34')).toBe('12.34%')
    })

    it('should format very small percentage correctly', function () {
      expect(englishFormatter.formatPercentage(0.001)).toBe('0.00%')
    })

    it('should format small decimal percentage correctly', function () {
      expect(englishFormatter.formatPercentage(0.01)).toBe('0.01%')
    })

    it('should format percentage with high precision correctly', function () {
      expect(englishFormatter.formatPercentage(99.999999)).toBe('100.00%')
    })

    it('should follow the locale separators', function () {
      expect(spanishFormatter.formatPercentage(87.5)).toBe('87,50%')
      expect(portugueseFormatter.formatPercentage(1234.5)).toBe('1.234,50%')
    })
  })

  describe('formatWholePercentage', function () {
    it('should round to a whole number', function () {
      expect(englishFormatter.formatWholePercentage(15.3)).toBe('15%')
      expect(englishFormatter.formatWholePercentage(23.6)).toBe('24%')
    })

    it('should follow the locale separators', function () {
      expect(englishFormatter.formatWholePercentage(1500)).toBe('1,500%')
      expect(spanishFormatter.formatWholePercentage(1500)).toBe('1500%')
      expect(portugueseFormatter.formatWholePercentage(1500)).toBe('1.500%')
    })

    it('should not show a sign for a negative value that rounds to zero', function () {
      expect(englishFormatter.formatWholePercentage(-0.4)).toBe('0%')
      expect(englishFormatter.formatWholePercentage(-0.6)).toBe('-1%')
    })
  })

  describe('formatFullAmount', function () {
    it('should keep every decimal up to the token decimals', function () {
      expect(
        englishFormatter.formatFullAmount('0.123456789012345678', 18),
      ).toBe('0.123456789012345678')
    })

    it('should not round a string beyond float precision', function () {
      expect(
        englishFormatter.formatFullAmount('12345678901234567.89', 18),
      ).toBe('12,345,678,901,234,567.89')
    })

    it('should cap the decimals at the token decimals', function () {
      expect(englishFormatter.formatFullAmount('1.123456789', 6)).toBe(
        '1.123457',
      )
    })

    it('should follow the locale separators, grouping 4-digit numbers too', function () {
      expect(spanishFormatter.formatFullAmount('1234.5', 18)).toBe('1.234,5')
      expect(portugueseFormatter.formatFullAmount('1234.5', 18)).toBe('1.234,5')
    })
  })
  describe('formatTokenPrice', function () {
    it('should keep sub-cent digits, capped at six decimals', function () {
      expect(englishFormatter.formatTokenPrice(0.00723137)).toBe('$0.007231')
      expect(englishFormatter.formatTokenPrice(0.0154)).toBe('$0.0154')
    })

    it('should read as money from a dollar up', function () {
      expect(englishFormatter.formatTokenPrice(3.5)).toBe('$3.50')
      expect(englishFormatter.formatTokenPrice(1234.5678)).toBe('$1,234.57')
    })

    it('should keep two decimals on zero', function () {
      expect(englishFormatter.formatTokenPrice(0)).toBe('$0.00')
    })

    it('should follow the locale separators', function () {
      expect(portugueseFormatter.formatTokenPrice(1234.5678)).toBe('$1.234,57')
      expect(spanishFormatter.formatTokenPrice(0.0154)).toBe('$0,0154')
    })
  })

  describe('formatAverageLockDuration', function () {
    const days = (amount: number) => amount * 60 * 60 * 24

    it('should use years from a full year up', function () {
      expect(englishFormatter.formatAverageLockDuration(days(657.45))).toBe(
        '1.8 years',
      )
      expect(englishFormatter.formatAverageLockDuration(days(365.25))).toBe(
        '1 year',
      )
    })

    it('should use months below a year', function () {
      expect(englishFormatter.formatAverageLockDuration(days(182.625))).toBe(
        '6 months',
      )
      expect(englishFormatter.formatAverageLockDuration(days(30.4375))).toBe(
        '1 month',
      )
    })

    it('should use weeks below a month', function () {
      expect(englishFormatter.formatAverageLockDuration(days(21))).toBe(
        '3 weeks',
      )
    })

    it('should use days below a week', function () {
      expect(englishFormatter.formatAverageLockDuration(days(6))).toBe('6 days')
      expect(englishFormatter.formatAverageLockDuration(0)).toBe('0 days')
    })

    it('should follow the locale for the unit and the separator', function () {
      expect(spanishFormatter.formatAverageLockDuration(days(657.45))).toBe(
        '1,8 años',
      )
      expect(portugueseFormatter.formatAverageLockDuration(days(182.625))).toBe(
        '6 meses',
      )
    })
  })
})
