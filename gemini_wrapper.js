const { GoogleGenerativeAI } = require("@google/generative-ai");

async function generate_explanation(prompt, apiKey) {
  try {
    if (!apiKey) {
      throw new Error("API key is required");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      return "Unable to generate explanation";
    }

    return text;
  } catch (error) {
    console.error(`Error generating explanation: ${error}`);
    return `Error generating explanation: ${error.message}`;
  }
}

module.exports = { generate_explanation };
