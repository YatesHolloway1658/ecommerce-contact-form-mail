import { routeContactForm } from "./contact-form.js";

const inbox = process.env.TEAM_INBOX;
if (!inbox) throw new Error("TEAM_INBOX is required");
const result = await routeContactForm({ name: "Mina", email: "mina@example.com", orderId: "ORD-42", message: "Please confirm the delivery window.", checkoutTotalCents: 2599, fulfillmentState: "packed", receiptNumber: "R-42" }, inbox);
console.log(`team inbox accepted order ${result.orderId}; message ${result.messageId}`);
