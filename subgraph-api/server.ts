import 'dotenv/config'
import config from 'config'

import { createServer } from './src/server.ts'

createServer().listen(config.get('port'))
