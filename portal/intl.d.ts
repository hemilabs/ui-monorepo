import { routing } from './i18n/routing'
import messages from './messages/en.json'

declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number]
    Messages: typeof messages
  }
}

declare global {
  /**
   * DurationTime Types are not added to Typescript yet. So I'm using module augmentation
   * to add them locally. These types were extracted from the Typescript PR
   * https://github.com/microsoft/TypeScript/pull/60646/files#diff-4d1ac1afc27a0b4c6a168c9bf57d6cda8ff6d987febc89ade1499db800d667de
   * */
  namespace Intl {
    type DurationTimeFormatLocaleMatcher = 'lookup' | 'best fit'
    /**
     * Value of the `unit` property in duration objects
     *
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/format#duration).
     */
    type DurationTimeFormatUnit =
      | 'years'
      | 'months'
      | 'weeks'
      | 'days'
      | 'hours'
      | 'minutes'
      | 'seconds'
      | 'milliseconds'
      | 'microseconds'
      | 'nanoseconds'

    /**
     * The style of the formatted duration.
     *
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/DurationFormat#style).
     */
    type DurationFormatStyle = 'long' | 'short' | 'narrow' | 'digital'

    type DurationFormatUnitSingular =
      | 'year'
      | 'quarter'
      | 'month'
      | 'week'
      | 'day'
      | 'hour'
      | 'minute'
      | 'second'

    /**
     * An object representing the relative time format in parts
     * that can be used for custom locale-aware formatting.
     *
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/formatToParts#examples).
     */
    type DurationFormatPart =
      | {
          type: 'literal'
          value: string
        }
      | {
          type: Exclude<NumberFormatPartTypes, 'literal'>
          value: string
          unit: DurationFormatUnitSingular
        }

    type DurationFormatOption =
      | 'long'
      | 'short'
      | 'narrow'
      | 'numeric'
      | '2-digit'

    type DurationFormatDisplayOption = 'always' | 'auto'

    /**
     * Number of how many fractional second digits to display in the output.
     *
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/DurationFormat#fractionaldigits).
     */
    type fractionalDigitsOption = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

    interface ResolvedDurationFormatOptions {
      locale?: UnicodeBCP47LocaleIdentifier
      numberingSystem?: DateTimeFormatOptions['numberingSystem']
      style?: DurationFormatStyle
      years?: Exclude<DurationFormatOption, 'numeric' | '2-digit'>
      yearsDisplay?: DurationFormatDisplayOption
      months?: Exclude<DurationFormatOption, 'numeric' | '2-digit'>
      monthsDisplay?: DurationFormatDisplayOption
      weeks?: Exclude<DurationFormatOption, 'numeric' | '2-digit'>
      weeksDisplay?: DurationFormatDisplayOption
      days?: Exclude<DurationFormatOption, 'numeric' | '2-digit'>
      daysDisplay?: DurationFormatDisplayOption
      hours?: DurationFormatOption
      hoursDisplay?: DurationFormatDisplayOption
      minutes?: DurationFormatOption
      minutesDisplay?: DurationFormatDisplayOption
      seconds?: DurationFormatOption
      secondsDisplay?: DurationFormatDisplayOption
      milliseconds?: DurationFormatOption
      millisecondsDisplay?: DurationFormatDisplayOption
      microseconds?: DurationFormatOption
      microsecondsDisplay?: DurationFormatDisplayOption
      nanosecond?: DurationFormatOption
      nanosecondDisplay?: DurationFormatDisplayOption
      fractionalDigits?: fractionalDigitsOption
    }

    interface DurationFormatOptions {
      localeMatcher?: DurationTimeFormatLocaleMatcher
      numberingSystem?: DateTimeFormatOptions['numberingSystem']
      style?: DurationFormatStyle
      years?: Exclude<DurationFormatOption, 'numeric' | '2-digit'>
      yearsDisplay?: DurationFormatDisplayOption
      months?: Exclude<DurationFormatOption, 'numeric' | '2-digit'>
      monthsDisplay?: DurationFormatDisplayOption
      weeks?: Exclude<DurationFormatOption, 'numeric' | '2-digit'>
      weeksDisplay?: DurationFormatDisplayOption
      days?: Exclude<DurationFormatOption, 'numeric' | '2-digit'>
      daysDisplay?: DurationFormatDisplayOption
      hours?: DurationFormatOption
      hoursDisplay?: DurationFormatDisplayOption
      minutes?: DurationFormatOption
      minutesDisplay?: DurationFormatDisplayOption
      seconds?: DurationFormatOption
      secondsDisplay?: DurationFormatDisplayOption
      milliseconds?: DurationFormatOption
      millisecondsDisplay?: DurationFormatDisplayOption
      microseconds?: DurationFormatOption
      microsecondsDisplay?: DurationFormatDisplayOption
      nanosecond?: DurationFormatOption
      nanosecondDisplay?: DurationFormatDisplayOption
      fractionalDigits?: fractionalDigitsOption
    }

    /**
     * The duration object to be formatted
     *
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/format#duration).
     */
    type DurationType = Record<DurationTimeFormatUnit, number>

    interface DurationFormat {
      /**
       * @param duration The duration object to be formatted. It should include some or all of the following properties: months, weeks, days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds.
       *
       * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/format).
       */
      format(duration: Partial<DurationType>): string
      /**
       * @param duration The duration object to be formatted. It should include some or all of the following properties: months, weeks, days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds.
       *
       * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/formatToParts).
       */
      formatToParts(duration: Partial<DurationType>): DurationFormatPart[]
      /**
       * [MDN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/resolvedOptions).
       */
      resolvedOptions(): ResolvedDurationFormatOptions
    }

    const DurationFormat: {
      prototype: DurationFormat

      /**
       * @param locales A string with a BCP 47 language tag, or an array of such strings.
       *   For the general form and interpretation of the `locales` argument, see the [Intl](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl#locale_identification_and_negotiation)
       *   page.
       *
       * @param options An object for setting up a duration format.
       *
       * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/DurationFormat).
       */
      new (
        locales?: LocalesArgument,
        options?: DurationFormatOptions,
      ): DurationFormat

      /**
       * Returns an array containing those of the provided locales that are supported in display names without having to fall back to the runtime's default locale.
       *
       * @param locales A string with a BCP 47 language tag, or an array of such strings.
       *   For the general form and interpretation of the `locales` argument, see the [Intl](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl#locale_identification_and_negotiation)
       *   page.
       *
       * @param options An object with a locale matcher.
       *
       * @returns An array of strings representing a subset of the given locale tags that are supported in display names without having to fall back to the runtime's default locale.
       *
       * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/supportedLocalesOf).
       */
      supportedLocalesOf(
        locales?: LocalesArgument,
        options?: { localeMatcher?: DurationTimeFormatLocaleMatcher },
      ): UnicodeBCP47LocaleIdentifier[]
    }
  }
}
