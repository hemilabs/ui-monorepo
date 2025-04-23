// Use type safe message keys with `next-intl`
type Messages = typeof import('./messages/en.json')
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
declare interface IntlMessages extends Messages {}
