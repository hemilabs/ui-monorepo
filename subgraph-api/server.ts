import 'dotenv/config'
import config from 'config'

import { createApiServer } from './src/api-server.ts'

createApiServer().listen(config.get('port'))
