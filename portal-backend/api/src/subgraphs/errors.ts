export class UpstreamGraphQLError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'UpstreamGraphQLError'
  }
}
