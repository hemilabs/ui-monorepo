import 'dotenv/config'
import config from 'config'

import { createServer } from './src/server'

createServer().listen(config.port)
