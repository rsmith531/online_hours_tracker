# TODO

- [ ] address TODOs
- [x] browser devtools should only render in dev mode
- [x] configure middleware to authenticate inbound traffic
- [ ] Make sure I am using all `nuxt-secure` features
- [ ] make my APIs type-safe (with zod?)
- [ ] Use an ORM for `db.ts`
- [ ] flesh out the readme
- [ ] get a domain name from namecheap
- [ ] get hosted on a VM
- [ ] configure caddy to fwd traffic to this app


# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Create the required TLS certificates to run as HTTPS:

1. `npx mkcert create-ca`

1. `npx mkcert create-cert --key localhost-key.pem --cert localhost.pem --domains ["localhost", "192.168.1.101"]`

Start the development server on `http://localhost:3000` & `https://192.168.1.101:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

### Resources

- [How to use Primevue Toast outside of a component](https://stackoverflow.com/questions/72425297/vue-warn-inject-can-only-be-used-inside-setup-or-functional-components)
- [How to make a push notification service worker](https://javascript.plainenglish.io/push-notifications-using-a-service-worker-5f2e371774e)
- [How to see console logs for service worker](https://discourse.mozilla.org/t/how-to-enable-console-log-from-service-worker/130394/8)
- [HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [How to do basic Nuxt auth](https://nuxt.com/docs/guide/recipes/sessions-and-authentication)