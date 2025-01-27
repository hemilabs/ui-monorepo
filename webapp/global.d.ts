import '@tanstack/react-table'

// Use type safe message keys with `next-intl`
type Messages = typeof import('./messages/en.json')
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
declare interface IntlMessages extends Messages {}

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    width?: string
  }
}
