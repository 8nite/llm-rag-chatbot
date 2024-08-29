import { handlePrompt } from "../../controllers/chatController";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { userId, prompt, rag } = req.body;

    try {
      const response = await handlePrompt(userId, prompt, rag, req.id); // Pass req.id for tracing
      res.status(200).json({ response });
    } catch (error) {
      console.error(`[${req.id}] [ERROR]`, error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
