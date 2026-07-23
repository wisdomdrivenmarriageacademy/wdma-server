import { Resend } from "resend"
import dotenv from "dotenv"
dotenv.config();

const resendApiKey = process.env.RESEND_API_KEY || "";
export const resend = new Resend(resendApiKey);

type SendEmailParams = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
};

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
}: SendEmailParams) {
  const fromAddress =
    from || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  // Build the email options object, only including defined properties
  const emailOptions: any = {
    from: fromAddress,
    to,
    subject,
  };

  if (html) {
    emailOptions.html = html;
  }

  if (text) {
    emailOptions.text = text;
  }

  const result = await resend.emails.send(emailOptions);
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export function buildOtpEmailHtml(otp: string) {
  return `
    <div>
      <h2>Your verification code</h2>
      <p>Use the OTP below to complete verification. It expires in 10 minutes.</p>
      <h3 style="font-size:24px;letter-spacing:4px;">${otp}</h3>
    </div>
  `;
}

export function buildPasswordResetEmailHtml(resetLink: string) {
  return `
    <div>
      <h2>Password reset</h2>
      <p>Click the link below to reset your password. It expires in 30 minutes.</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
    </div>
  `;
}
