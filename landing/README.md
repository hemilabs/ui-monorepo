# Landing Page

## Development

Run the following command so styles are auto-generated as you develop:

```bash
npx tailwindcss -i globals.css -o app.css --watch
```

There's no hot reloading, so you'll have to refresh the page manually.
Before committing, it is recommended to restart the watcher (with `--minify` flag) to remove the unused generated tailwind classes (See [this issue for explanation](https://github.com/tailwindlabs/tailwindcss-jit/issues/57)), and to minify the code ready to be published.

## Deploy

the content of the landing folder must be deployed (all of it\*) as a static page (It's just a static page with a bunch of CSS and js scripts).

The only files that must be excluded are:

`Readme.md`

`tailwind.config.js`
