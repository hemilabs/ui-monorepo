import 'dotenv/config'
import config from 'config'

import { createApiServer } from './src/api-server.ts'

const port = config.get<number>('port')

createApiServer().listen(port)

// eslint-disable-next-line no-console
console.info(`API server listening on port ${port}`)
