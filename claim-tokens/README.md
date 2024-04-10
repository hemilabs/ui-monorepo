# claim-tokens

## Setup

Use the [migrations-pg](../migrations-pg) project to set up a local database which should be running to run this project.

Then start the local environment with

```sh
npm run dev
```

## Environment variables

```sh
MARKETING_DOMAIN_URL=<marketing-domain-url> # defaults to http://127.0.0.1:3001
IP_QUALITY_SCORE_SECRET_KEY=<ip-quality-score-secret-key>
RECAPTCHA_SECRET_KEY=<recaptcha-v3-secret-key>
```

The `MARKETING_DOMAIN_URL` must be set for CORS.

You can create a recaptcha secret key at [https://www.google.com/recaptcha/admin](https://www.google.com/recaptcha/admin). The SITE_KEY generated will be used in the frontend. The domain of the frontend should also be whitelisted (Use `127.0.0.1` for localhost, `MARKETING_DOMAIN_URL` once deployed).

You can create a IP Quality Score Secret key at [https://www.ipqualityscore.com/](https://www.ipqualityscore.com/).

## Deployment

Ensure that the database is created in the target environment (If not, see [migrations-pg](../migrations-pg#create-and-setup-the-database-in-aws)).  
Ensure that migrations are run in the target environment.

Set the appropriate environment variable values (listed above, and including the [database connection values](../migrations-pg#create-and-setup-the-database-in-aws)), and run the following commands:

```sh
npm run deploy
```
