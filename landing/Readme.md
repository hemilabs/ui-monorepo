# Landing Page

## Development

Run the following command so styles are auto-generated as you develop:

```bash
npx tailwindcss -i globals.css -o app.css --watch
```

There's no hot reloading, so you'll have to refresh the page manually.  
Before committing, it is recommended to restart the watcher (with `--minify` flag) to remove the unused generated tailwind classes (See [this issue for explanation](https://github.com/tailwindlabs/tailwindcss-jit/issues/57)), and to minify the code ready to be published.
