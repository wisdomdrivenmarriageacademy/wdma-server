import paypal from "paypal-rest-sdk";

paypal.configure({
  mode: "sandbox", // "sandbox" for testing or "live" for production
  client_id: process.env.PAYPAL_CLIENT_ID as string,
  client_secret: process.env.PAYPAL_SECRET_ID as string,
});

export default paypal;
