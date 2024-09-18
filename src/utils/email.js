import nodemailer from "nodemailer";

export async function sendEscalationEmail({
  from = null,
  to,
  subject,
  message,
}) {
  // Create a transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // Your email username
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  await transporter.sendMail({
    from: from || `"Nexvision Support" <${process.env.EMAIL_FROM}>`, // Sender address
    to, // List of receivers
    subject, // Subject line
    text: message,
  });

  console.log(`Email sent to ${to} with subject: ${subject}`);
}
