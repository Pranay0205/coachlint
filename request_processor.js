const { generate_explanation } = require('./gemini_wrapper');

async function process_current_error_message(request, apiKey) {
    const prompt = `Explain the error in a very short manner should contain only two lines and shortly explain how to resolve it: ${request.errorMessage}\n`;
    
    const ai_explanation = await generate_explanation(prompt, apiKey);
    
    const message = `${request.fileName}:${request.lineNumber}:${request.columnNumber} timestamp: ${request.timestamp}\n\n${ai_explanation}`;
    
    return { message: message };
}

async function process_hover_error_message(request, apiKey) {
    const prompt = `Explain the error in a very short manner should contain only two lines and shortly explain how to resolve it: ${request.errorMessage}\n`;

    const ai_explanation = await generate_explanation(prompt, apiKey);
    
    return { message: ai_explanation };
}

async function process_code_review_message(request, apiKey) {
    const prompt = `Review this Python code. Give EXACTLY 3 short suggestions only if there are issues otherwise don't include 📍 in your reponse and just say Good Code. Use the following format:

📍 Line X: CATEGORY → Brief issue → Why it matters

Categories: NAMING, PERFORMANCE, DOCS, LOGIC, POTENTIAL BUG, SECURITY, STYLE

Code:
${request.code}`;
    
    const ai_response = await generate_explanation(prompt, apiKey);
    
    if (ai_response === null || ai_response === undefined) {
        return { message: "Unable to generate code review suggestions" };
    }
    
    const count = (ai_response.match(/📍/g) || []).length;
    let message;
    if (count === 0) {
        message = "✅ GREAT CODE! No issues found.";
    } else {
        message = `🔍 ${count} SUGGESTIONS\n\n${ai_response}`;
    }
    
    return { message: message };
}

module.exports = {
    process_current_error_message,
    process_hover_error_message,
    process_code_review_message
};