import { handlePrompt } from "../../controllers/chatController";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { userId, prompt, rag, apiKey } = req.body;

    try {
      const response = await handlePrompt(userId, prompt, rag, req.id, apiKey); // Pass req.id for tracing
      res.status(200).json({ response });
    } catch (error) {
      if (error.message.includes("Authentication error")) {
        res.status(401).json({ error: error.message }); // Return a 401 status code for authentication errors
      } else {
        console.error(`[${req.id}] [ERROR]`, error);
        res.status(500).json({ error: error.message });
      }
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
