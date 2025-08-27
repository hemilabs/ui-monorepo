import { NextFunction, Request, Response } from 'express'

export const isInteger = (string: string) => /^\d+$/.test(string)

// Utility function to wrap async route handlers and catch errors
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    // eslint-disable-next-line promise/no-callback-in-promise
    Promise.resolve(fn(req, res, next)).catch(next)

export const sendJsonResponse = function (
  res: Response,
  statusCode: number,
  data: object,
) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}
