// Import the sendEscalationEmail function from utils/email.js
import { sendEscalationEmail } from "../../utils/email";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { from, subject, message } = req.body;

    // Validate that the required fields are present
    if (!to || !subject || !message) {
      return res
        .status(400)
        .json({ error: "Missing required fields: to, subject, message" });
    }

    try {
      // Call the sendEscalationEmail function to send the email
      await sendEscalationEmail({
        from,
        to: `"Nexvision Support" <${process.env.EMAIL_FROM}>`,
        subject,
        message,
      });

      // Respond with a success message
      res.status(200).json({ message: `Email sent to ${to}` });
    } catch (error) {
      // Handle any errors and return a 500 status
      console.error(`Failed to send email: ${error.message}`);
      res.status(500).json({ error: "Failed to send email" });
    }
  } else {
    // Return a 405 Method Not Allowed if the request method is not POST
    res.status(405).json({ error: "Method not allowed" });
  }
}
