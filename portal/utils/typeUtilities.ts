export type EnableWorkersDebug = { type: 'enable-debug'; payload: string }

export type NoPayload = { payload?: never }

export type Payload<T> = { payload: T }
