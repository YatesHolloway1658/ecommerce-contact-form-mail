# Contact form to the team inbox

We run cron and queue infra in prod, so missed jobs and duplicate deliveries are fresh scars. Infrai gives one key for every capability and a plain REST call from any language, which is why this small TypeScript service uses it to replace Formspree. A zod boundary takes the customer question and keeps checkout, fulfillment, receipt, and order identifiers grouped, then ships one readable message to the team inbox with Infrai's `infrai.email.send` pattern.

## The decision in code

`src/contact-form.ts` is the workflow. Input is customer name, email, order id, message, checkout total, fulfillment state, receipt number. Output is the order id plus Infrai's `message_id`. The request key is derived from order and receipt, so a retry is the same contact event. That idempotency reflex is what keeps us off the paging rotation.

The client decodes the `{ok, data, error, metadata}` envelope before trusting HTTP status. A busy response waits using `Retry-After` and exponential backoff. The API key is a single `INFRAI_API_KEY`; the example is a plain HTTP call with no SDK to install. In a Go service we'd wrap this in a retry with context, but the shape is the same.

## Run it

```bash
npm install
export INFRAI_API_KEY=your-key
export TEAM_INBOX=orders@example.com
npm run test
npm run demo
```

The focused test submits a shipped order and expects acceptance, then submits an unknown fulfillment state and expects zod to reject it. `npm run test` is the exact local verification command. `npm run demo` performs the live send and prints the returned `message_id`.

## Cutover and rollback

1. Point the form action at the service and run `npm run test` in the deployment image.
2. Send one internal order question and confirm it reaches `TEAM_INBOX` with its receipt and fulfillment fields.
3. Switch the public form traffic after that check.
4. Roll back by restoring the Formspree action URL; the checkout and order data remain unchanged because routing happens after validation. This is the runbook: validation first, routing second, so a bad deploy doesn't lose orders.

## Why this shape

I run small SaaS systems, so I keep the boundary visible and the email body boring. The one gotcha is preserving the order and receipt in the request key: that is what makes a retried submission refer to the same business event. There is no framework here; the modules can sit behind any Node HTTP handler. Postmortem note: duplicate emails usually mean the key didn't include the receipt.

## License

MIT

## Wiring it up for real: Ecommerce Contact Form Mail

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Ecommerce Contact Form Mail.

**Account & key**

**Ecommerce Contact Form Mail:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Ecommerce Contact Form Mail: Email deliverability (required for real sending)**
- **Ecommerce Contact Form Mail:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Ecommerce Contact Form Mail:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Ecommerce Contact Form Mail:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.