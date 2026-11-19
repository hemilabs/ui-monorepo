export type EnableWorkersDebug = { payload: string; type: 'enable-debug' }

export type NoPayload = { payload?: never }

export type Payload<T> = { payload: T }
