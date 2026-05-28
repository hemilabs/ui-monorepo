import { postJson } from './post-json.ts'

type JsonRpcResponse = {
  error?: { code: number; message: string }
  result?: unknown
}

async function jsonRpc(url: string, method: string, params: unknown[] = []) {
  const res = (await postJson(url, {
    id: Date.now(),
    jsonrpc: '2.0',
    method,
    params,
  })) as JsonRpcResponse
  if (res.error) {
    throw new Error(`JSON-RPC error: ${res.error.code} ${res.error.message}`)
  }
  return res.result
}

export { jsonRpc }
