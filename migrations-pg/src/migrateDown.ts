import config from 'config'
import knex from 'knex'

function migrateDown() {
  // cloning as config is immutable but knex modifies the object
  const pg = knex(config.util.cloneDeep(config.get('postgres')))
  return pg.migrate
    .down()
    .then(() => pg.destroy())
    .catch(err => console.error('Migration failure', err))
}

migrateDown()
