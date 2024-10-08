'use strict'

const config = require('config')
const knex = require('knex')

// cloning because knex modifies the object, but config is immutable
const db = knex(config.util.cloneDeep(config.get('postgres')))

module.exports = {
  db,
  // See https://knexjs.org/guide/transactions.html
  getTransaction: () => db.transaction(),
}
