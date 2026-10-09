import { contactForm } from "./contact-form.js";

const valid = { name: "Mina", email: "mina@example.com", orderId: "ORD-42", message: "Where is my parcel?", checkoutTotalCents: 2599, fulfillmentState: "shipped", receiptNumber: "R-42" };
if (!contactForm.safeParse(valid).success) throw new Error("valid order contact should pass");
if (contactForm.safeParse({ ...valid, fulfillmentState: "cancelled" }).success) throw new Error("unknown fulfillment state should be rejected");
console.log("contact boundary test passed: shipped order is accepted and unknown state is rejected");
