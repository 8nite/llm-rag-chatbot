import axios from "axios";
import Rag from "../models/rag";
import Message from "../models/message";
import dbConnect from "../utils/dbConnect";

export async function handlePrompt(userId, prompt, rag, reqId) {
  console.log(`[${reqId}] [INFO] Handling prompt for user: ${userId}`);

  try {
    console.log(`[${reqId}] [INFO] Connecting to the database...`);
    await dbConnect();
    console.log(`[${reqId}] [INFO] Connected to the database.`);

    console.log(`[${reqId}] [INFO] Fetching RAG data for rag: ${rag}`);
    const ragEntry = await Rag.findOne({ rag });

    const systemMessage =
      ragEntry?.systemMessage || "Default system message if none is found";
    console.log(
      `[${reqId}] [INFO] System message fetched: ${systemMessage.length}`
    );

    console.log(
      `[${reqId}] [INFO] Fetching conversation history for user: ${userId}`
    );
    const userPrompts = await Message.find({ userId, role: "user" });
    console.log(
      `[${reqId}] [INFO] Retrieved ${userPrompts.length} user prompts`
    );

    console.log(`[${reqId}] [INFO] Constructing message sequence...`);
    const messages = [
      { role: "system", content: systemMessage },
      ...userPrompts.reverse().map((entry) => ({
        role: entry.role,
        content: entry.content,
      })),
      { role: "user", content: prompt },
    ];

    console.log(
      `[${reqId}] [INFO] Sending data to Cloudflare Workers AI API...`
    );
    const data = {
      model: process.env.CLOUDFLARE_MODEL_NAME,
      messages: messages,
    };

    const headers = {
      Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/${process.env.CLOUDFLARE_MODEL_NAME}`,
      data,
      {
        headers,
      }
    );

    console.log(
      `[${reqId}] [INFO] Received response from Cloudflare Workers AI API`
    );
    const aiResponse = response.data.result.response;

    console.log(
      `[${reqId}] [INFO] Checking for existing message with the same content...`
    );
    const existingMessage = await Message.findOne({
      userId,
      content: aiResponse,
    });

    if (existingMessage) {
      console.log(
        `[${reqId}] [INFO] Accumulating content to existing message with ID: ${existingMessage._id}`
      );
      await Message.updateOne(
        { _id: existingMessage._id },
        { $set: { content: existingMessage.content + " " + aiResponse } }
      );
    } else {
      console.log(`[${reqId}] [INFO] Saving new conversation to MongoDB...`);
      await Message.create([
        { userId, role: "user", content: prompt },
        { userId, role: "assistant", content: aiResponse },
      ]);
    }

    console.log(`[${reqId}] [INFO] AI response returned successfully.`);
    return aiResponse;
  } catch (error) {
    console.error(`[${reqId}] [ERROR] An error occurred: ${error.message}`);
    throw new Error("An error occurred while processing the prompt.");
  }
}
