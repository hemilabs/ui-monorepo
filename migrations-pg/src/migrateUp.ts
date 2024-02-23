import config from 'config'
import knex from 'knex'

function migrateUp() {
  // cloning as config is immutable but knex modifies the object
  const pg = knex(config.util.cloneDeep(config.get('postgres')))
  return pg.migrate
    .latest()
    .then(() => pg.destroy())
    .then(() => console.log('Migration complete'))
}

migrateUp()
