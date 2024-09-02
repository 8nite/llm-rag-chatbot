import axios from "axios";
import Rag from "../models/rag";
import Message from "../models/message";
import dbConnect from "../utils/dbConnect";
import { sendEscalationEmail } from "../utils/email"; // Import the email utility

export async function handlePrompt(userId, prompt, rag, reqId, apiKey) {
  console.log(`[${reqId}] [INFO] Handling prompt for user: ${userId}`);

  try {
    console.log(`[${reqId}] [INFO] Connecting to the database...`);
    await dbConnect();
    console.log(`[${reqId}] [INFO] Connected to the database.`);

    console.log(`[${reqId}] [INFO] Fetching RAG data for rag: ${rag}`);
    const ragEntry = await Rag.findOne({ rag });

    if (!ragEntry) {
      console.error(`[${reqId}] [ERROR] RAG entry not found for rag: ${rag}`);
      throw new Error("RAG entry not found.");
    }

    // Check if the provided apiKey matches the one stored in the Rag entry
    if (apiKey !== ragEntry.apiKey) {
      console.error(`[${reqId}] [ERROR] Invalid API key provided.`);
      throw new Error("Authentication error: Invalid API key.");
    }

    const systemMessage =
      ragEntry.systemMessage || "Default system message if none is found";
    console.log(
      `[${reqId}] [INFO] System message fetched: ${systemMessage.length}`
    );

    console.log(
      `[${reqId}] [INFO] Fetching conversation history for user: ${userId}`
    );
    const userPrompts = await Message.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);
    console.log(
      `[${reqId}] [INFO] Retrieved ${userPrompts.length} previous messages`
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

    // Check if email escalation is enabled
    if (ragEntry.emailEnable) {
      console.log(`[${reqId}] [INFO] Checking for escalation condition...`);
      const escalationRegExp = new RegExp(ragEntry.esculateExp);
      if (escalationRegExp.test(aiResponse)) {
        console.log(
          `[${reqId}] [INFO] Escalation condition met. Sending email...`
        );

        // Construct the email content with the previous 10 messages
        let emailContent = `The following response triggered an escalation:\n\n${aiResponse}\n\nUser ID: ${userId}\nPrompt: ${prompt}\n\n--- Previous Messages ---\n`;

        userPrompts.reverse().forEach((entry, index) => {
          emailContent += `\n${index + 1}. ${
            entry.role === "user" ? "User" : "Assistant"
          }: ${entry.content}`;
        });

        await sendEscalationEmail({
          to: ragEntry.email,
          subject: `Escalation Alert: ${rag}`,
          message: emailContent,
        });
        console.log(`[${reqId}] [INFO] Escalation email sent.`);
      } else {
        console.log(`[${reqId}] [INFO] No escalation needed.`);
      }
    }

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
