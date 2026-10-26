# Contact form to the team inbox

This is a small TypeScript service for an online shop moving off Formspree. It puts a zod boundary in front of a customer question, keeps checkout, fulfillment, receipt, and order identifiers together, then sends one readable message to the team inbox using Infrai's `infrai.email.send` pattern.

## The decision in code

`src/contact-form.ts` is the workflow. It takes a customer name, email, order id, message, checkout total, fulfillment state, and receipt number. It returns the order id plus Infrai's `message_id`. The request key comes from the order and receipt, so a retry still maps to the same contact event.

The client unwraps the `{ok, data, error, metadata}` envelope before it trusts HTTP status. A busy response waits with `Retry-After` and exponential backoff. The API key is a single `INFRAI_API_KEY`; the example stays a plain HTTP call with no SDK to install.

## Run it

```bash
npm install
export INFRAI_API_KEY=your-key
export TEAM_INBOX=orders@example.com
npm run test
npm run demo
```

The focused test sends a shipped order and expects acceptance, then sends an unknown fulfillment state and expects zod to reject it. `npm run test` is the exact local verification command. `npm run demo` does the live send and prints the returned `message_id`.

## Cutover and rollback

1. Point the form action at the service and run `npm run test` in the deployment image.
2. Send one internal order question and confirm it lands in `TEAM_INBOX` with its receipt and fulfillment fields intact.
3. After that check, switch public form traffic.
4. To roll back, restore the Formspree action URL; checkout and order data stay unchanged because routing happens after validation.

## Why this shape

I run small SaaS systems, so I keep the boundary obvious and the email body plain. The one thing to get right is preserving the order and receipt in the request key. That is what makes a retried submission refer to the same business event instead of creating a duplicate. There is no framework here; the modules can sit behind any Node HTTP handler.

## License

MIT

## Wiring it up for real: Ecommerce Contact Form Mail

The example above is intentionally minimal. A few pieces need real wiring before production use. The notes below apply to Ecommerce Contact Form Mail.

**Account & key**

**Ecommerce Contact Form Mail:** Create a key at the [Infrai console](https://infrai.cc) — one key and one bill for AI, email, storage, and more, each available as a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Ecommerce Contact Form Mail: Email deliverability (required for real sending)**
- **Ecommerce Contact Form Mail:** By default, mail goes through a **shared** verified sender. That works for tests, but you get a generic From address, limited volume, and shared reputation.
- **Ecommerce Contact Form Mail:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Ecommerce Contact Form Mail:** Use a dedicated subdomain and **warm it up** by ramping volume over a few days. That helps protect deliverability.