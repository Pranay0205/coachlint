const { GoogleGenerativeAI } = require("@google/generative-ai");

async function generate_explanation(prompt, apiKey, model_name = "gemini-2.5-flash-lite") {
  try {
    if (!apiKey) {
      throw new Error("API key is required");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelInstance = genAI.getGenerativeModel({ model: model_name });

    const result = await modelInstance.generateContent(prompt);
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
