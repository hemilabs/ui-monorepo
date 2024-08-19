// Exclude optionality from object fields, and prevent the fields from accepting null or undefined values
export type DefinedFields<T extends object> = {
  [P in keyof T]-?: Exclude<T[P], null | undefined>
}

export type NoPayload = { payload?: never }

export type Payload<T> = { payload: T }
