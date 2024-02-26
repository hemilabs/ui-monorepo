import config from 'config'
import knex, { type Knex } from 'knex'

const cronJobName = 'ip_accesses_purge'

type Job = {
  jobid: number
  jobname: string
}

const connectToDefaultDatabase = function () {
  // We need to connect to the default postgres database to create/remove the job, and then update the database where it runs.
  // See https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/PostgreSQL_pg_cron.html#PostgreSQL_pg_cron.otherDB
  const defaultDatabaseConnection = config.util.cloneDeep(
    config.get('postgres'),
  )
  defaultDatabaseConnection.connection.database = 'postgres'
  return knex(defaultDatabaseConnection)
}

const enableIpPurging = function () {
  const pg = connectToDefaultDatabase()
  return pg
    .raw('CREATE EXTENSION IF NOT EXISTS pg_cron')
    .then(() =>
      pg.raw(
        `SELECT cron.schedule('${cronJobName}', '0 * * * *', $$DELETE FROM ip_accesses WHERE created_at < (NOW() - INTERVAL '${config.get(
          'claimTokens.ipDaysBan',
        )} days')$$);`,
      ),
    )
    .then(() =>
      pg.raw(
        `UPDATE cron.job SET database = '${config.get(
          'postgres.connection.database',
        )}' WHERE jobname = '${cronJobName}'`,
      ),
    )
    .then(() => pg.destroy())
}

const disableIpPurging = function () {
  const pg = connectToDefaultDatabase()
  return pg
    .from<Job, Job>('cron.job')
    .where({ jobname: cronJobName })
    .first()
    .then(function (job) {
      if (!job) {
        return undefined
      }
      return pg.raw(`SELECT cron.unschedule(${job.jobid});`)
    })
    .then(() => pg.raw('DROP EXTENSION pg_cron;'))
    .then(() => pg.destroy())
}

export const down = (pg: Knex) =>
  Promise.all([
    pg.schema.dropTable('email_submissions'),
    pg.schema.dropTable('ip_accesses'),
    process.env.NODE_ENV === 'dev' ? Promise.resolve() : disableIpPurging(),
  ])

export const up = (pg: Knex) =>
  Promise.all([
    pg.schema.createTable(
      'email_submissions',
      function (tableBuilder: Knex.TableBuilder) {
        tableBuilder.increments('id').primary()
        tableBuilder
          .string('email')
          .notNullable()
          .unique({ indexName: 'email_unique_index' })
        tableBuilder.string('ip').notNullable()
        // This will automatically convert the timestamp into UTC when saved
        // and back to the timezone when retrieved from the session
        tableBuilder
          .timestamp('submitted_at', { useTz: true })
          .defaultTo(pg.fn.now())
      },
    ),
    pg.schema.createTable(
      'ip_accesses',
      function (tableBuilder: Knex.TableBuilder) {
        tableBuilder.increments('id').primary()
        tableBuilder
          .string('ip')
          .notNullable()
          .unique({ indexName: 'ip_unique_index' })
        tableBuilder
          .timestamp('created_at', { useTz: true })
          .defaultTo(pg.fn.now())
      },
    ),
  ])
    // The pg job will prune the IPs, running every hour.
    // However, the extension is not available on the local database from docker.
    .then(() =>
      process.env.NODE_ENV === 'dev' ? undefined : enableIpPurging(),
    )
