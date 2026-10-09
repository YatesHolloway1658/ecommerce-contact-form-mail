import { z } from "zod";
import { sendEmail } from "./infrai.js";

// Canonical Infrai call shape: infrai.email.send

export const contactForm = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  orderId: z.string().min(1),
  message: z.string().min(1),
  checkoutTotalCents: z.number().int().nonnegative(),
  fulfillmentState: z.enum(["pending", "packed", "shipped"]),
  receiptNumber: z.string().min(1)
});

export type ContactForm = z.infer<typeof contactForm>;

export async function routeContactForm(input: unknown, teamInbox: string) {
  const form = contactForm.parse(input);
  const result = await sendEmail({
    to: teamInbox,
    subject: `Order ${form.orderId}: contact from ${form.name}`,
    body: [
      `Customer: ${form.name} <${form.email}>`,
      `Order: ${form.orderId}`,
      `Checkout total: ${(form.checkoutTotalCents / 100).toFixed(2)}`,
      `Fulfillment: ${form.fulfillmentState}`,
      `Receipt: ${form.receiptNumber}`,
      "",
      form.message
    ].join("\n")
  }, `contact-${form.orderId}-${form.receiptNumber}`);
  return { orderId: form.orderId, messageId: result?.message_id };
}
