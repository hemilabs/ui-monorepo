# Webapp

## Project setup

### Environment variables

The environment variables are defined in the `.env` file at the root of the project.
The prefix `NEXT_PUBLIC_` is required for the variables to be available in the browser. A few variables need to be set to run locally (in a `.env.local`), in addition to the ones already defined in the `.env`

```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="<recaptcha-v3-key>"
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="<claim-tokens-url>"
```

The recaptcha v3 key can be generated [in this page](https://www.google.com/recaptcha/admin/create).

## Deployment

Inside the `webapp` folder, create a `.env.production` with the following configuration

```bash
NEXT_PUBLIC_CLAIM_TOKENS_URL="<claim-tokens-url>"
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="<recaptcha-v3-key>"
NEXT_PUBLIC_TESTNET_MODE=true|false # Depending on the network being deployed
```

and then run

```bash
npm run build
```

The .out folder's content should be deployed as a static page.
