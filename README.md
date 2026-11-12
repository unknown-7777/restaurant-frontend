# restaurant-frontend

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

## Table QR ordering

Each table's details in the admin Tables page show a QR code that guests can scan to open the menu and submit an order for that table without signing in. The QR image is generated in the browser.

QR links use the current site origin, and the API defaults to that same hostname on port `8000`. For phone testing, start the frontend with `npm run dev -- --host 0.0.0.0` and Laravel with `php artisan serve --host 0.0.0.0`; open the frontend using the computer's LAN IP (not `localhost`) while the phone is on the same Wi-Fi. If the API runs on another host, set `VITE_API_URL` before starting/building the frontend. The API CORS config allows localhost and private LAN origins.
