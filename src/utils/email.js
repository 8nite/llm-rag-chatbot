import nodemailer from "nodemailer";

export async function sendEscalationEmail({ to, subject, message }) {
  // Create a transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // Your email username
      pass: process.env.EMAIL_PASS, // Your email password
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // Send mail with defined transport object
  await transporter.sendMail({
    from: `"Nexvision Support" <${process.env.EMAIL_FROM}>`, // Sender address
    to, // List of receivers
    subject, // Subject line
    text: message, // Plain text body
  });

  console.log(`Email sent to ${to} with subject: ${subject}`);
}
