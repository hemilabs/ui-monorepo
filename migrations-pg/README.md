# migrations-pg

## Local dev

Postgres version: 16.2

```sh
# Start the docker container
npm run db:start

# Run migrations locally
npm run migrate:up
```

## Create and setup the database in AWS

- Create a Postgres database in AWS RDS (v16.2), setting it up with a VPC, security group, and subnet group that allows for public access
- In Amazon RDS, go to "Parameter Groups" in the navigation pane, and create a new parameter group picking "Parameter group family" with the database version that matches the one created. A name and description must be completed
- Open the newly created Parameter Group, click on "Edit" and in the list of parameters, search and change:
  - `rds.force_ssl`, from 1 to 0
  - `shared_preload_libraries`, appending `pg_cron` to the list of libraries preloaded.
- In the database list, go to "Configuration" and change the parameter group to the one created
- After the database is modified, reboot the database.

In order to connect to this instance, set `STAGE` to the appropriate environment (staging/prod), and configure the following variables:

```sh
STAGE="staging"
# For running "npm run deploy", these should be prefixed with "DEPLOY_" in CI env.
POSTGRES_CONNECTION_DATABASE="<database-name>"
POSTGRES_CONNECTION_HOST="<endpoint-url>"
POSTGRES_CONNECTION_PASSWORD="<password>"
POSTGRES_CONNECTION_USER="<username>"
```
