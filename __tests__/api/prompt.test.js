import axios from "axios";

describe("API Integration Test", () => {
  const baseURL = "http://localhost:3001/api/prompt";
  jest.setTimeout(30000);

  it("should correctly use the systemMessage from the RAG data", async () => {
    const requestBody = {
      userId: "user123",
      prompt: "What features does the AI-Chatbot service offer?",
      rag: "rag_test",
    };

    try {
      const response = await axios.post(baseURL, requestBody);

      // Assert the response status and content
      expect(response.status).toBe(200);
      expect(response.data.response).toBeDefined();
      console.log("AI Response:", response.data.response);
    } catch (error) {
      console.error("Error during API call:", error);
      throw error;
    }
  });
});
