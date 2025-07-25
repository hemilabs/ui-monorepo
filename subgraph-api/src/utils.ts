import { Response } from 'express'

export const isInteger = (string: string) => /^\d+$/.test(string)

export const sendJsonResponse = function (
  res: Response,
  statusCode: number,
  data: object,
) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}
