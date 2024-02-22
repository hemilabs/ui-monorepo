# Marketing Page

## Env variables

Create a `.env.local` with the following configuration

```sh
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="<recaptcha-v3-key>"
```

The recaptcha v3 key can be generated [in this page](https://www.google.com/recaptcha/admin/create).

## Development

```sh
npm run dev
```

## Deployment

Create a `.env.production` with the following configuration

```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="<recaptcha-v3-key>"
NEXT_PUBLIC_TESTNET_MODE=true|false # Depending on the network being deployed
```

Run the following command

```bash
npm run build
```

Deploy the `.out` folder to the server
