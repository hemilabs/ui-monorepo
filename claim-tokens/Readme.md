# claim-tokens

## Environment variables

```sh
IP_QUALITY_SCORE_SECRET_KEY=<ip-quality-score-secret-key>
RECAPTCHA_SECRET_KEY=<recaptcha-v3-secret-key>
```

You can create a recaptcha secret key at [https://www.google.com/recaptcha/admin](https://www.google.com/recaptcha/admin). The SITE_KEY generated will be used in the frontend. The domain of the frontend should also be whitelisted (Use `127.0.0.1` for localhost).

You can create a IP Quality Score Secret key at [https://www.ipqualityscore.com/](https://www.ipqualityscore.com/).
