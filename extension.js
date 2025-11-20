const vscode = require("vscode");
const { process_hover_error_message, process_code_review_message } = require("./request_processor");

function activate(context) {
  console.log("CoachLint is running...!");

  // Cache explanations to avoid re-generating
  const explanationCache = new Map();
  let coachLintOutputChannel = vscode.window.createOutputChannel("CoachLint");
  coachLintOutputChannel.appendLine("===================COACHLINT AI COACH======================\n");

  // Command to set API key
  const setApiKeyCommand = vscode.commands.registerCommand("coachlint.setApiKey", async () => {
    const apiKey = await vscode.window.showInputBox({
      prompt: "Enter your Gemini API key for CoachLint",
      password: true, // Hide the input for security
      placeHolder: "your-gemini-api-key-here",
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return "API key cannot be empty";
        }
        if (value.length < 10) {
          return "API key seems too short";
        }
        return null;
      },
    });

    if (apiKey) {
      // Store the API key in VS Code settings
      await vscode.workspace.getConfiguration("coachlint").update("apiKey", apiKey, vscode.ConfigurationTarget.Global);

      vscode.window.showInformationMessage("✅ API key saved successfully!");

      // Clear cache when API key changes
      explanationCache.clear();
    }
  });

  // Command to show current API key status
  const showApiKeyStatusCommand = vscode.commands.registerCommand("coachlint.showApiKeyStatus", async () => {
    const apiKey = getApiKey();

    if (apiKey) {
      const maskedKey = apiKey.substring(0, 8) + "...";
      vscode.window.showInformationMessage(`🔑 API key is set: ${maskedKey}`);
    } else {
      const action = await vscode.window.showWarningMessage(
        "No API key set. CoachLint won't work without an API key.",
        "Set API Key"
      );

      if (action === "Set API Key") {
        vscode.commands.executeCommand("coachlint.setApiKey");
      }
    }
  });

  // Command to clear API key
  const clearApiKeyCommand = vscode.commands.registerCommand("coachlint.clearApiKey", async () => {
    const confirm = await vscode.window.showWarningMessage("Are you sure you want to clear the API key?", "Yes", "No");

    if (confirm === "Yes") {
      await vscode.workspace
        .getConfiguration("coachlint")
        .update("apiKey", undefined, vscode.ConfigurationTarget.Global);
      explanationCache.clear();
      vscode.window.showInformationMessage("🗑️ API key cleared");
    }
  });

  const setModelNameCommand = vscode.commands.registerCommand("coachlint.setModelName", async () => {
    const modelName = await vscode.window.showInputBox({
      prompt: "Enter the model name for CoachLint",
      placeHolder: "gemini-2.5-flash-lite (Default)",
    });

    if (modelName) {
      await vscode.workspace
        .getConfiguration("coachlint")
        .update("modelName", modelName, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(`✅ Model name set to ${modelName}`);
    }
  });

  context.subscriptions.push(setApiKeyCommand, showApiKeyStatusCommand, clearApiKeyCommand, setModelNameCommand);

  // Helper function to get API key
  function getApiKey() {
    return vscode.workspace.getConfiguration("coachlint").get("apiKey");
  }

  function getModelName() {
    return vscode.workspace.getConfiguration("coachlint").get("modelName") || "gemini-2.5-flash-lite";
  }
  // On Hover error explanation
  const OnErrorHoverExplanation = vscode.languages.registerHoverProvider("*", {
    async provideHover(document, position) {
      const diagnostics = vscode.languages.getDiagnostics(document.uri);

      const diagnostic = diagnostics.find((d) => d.range.contains(position));

      if (diagnostic) {
        const aiExplanation = await getGeneratedExplanation(diagnostic, document.uri);

        if (aiExplanation) {
          const markdown = new vscode.MarkdownString();

          markdown.appendMarkdown(`**🤖 AI Explanation:**\n\n ${aiExplanation}`);
          markdown.appendMarkdown(`\n\n----\n\n**Original Error:** ${diagnostic.message}`);

          return new vscode.Hover(markdown);
        }
      }
      return null;
    },
  });

  async function getGeneratedExplanation(diagnostic, uri) {
    const key = `${uri.toString()}-${diagnostic.message}`;

    if (explanationCache.has(key)) {
      return explanationCache.get(key);
    }

    try {
      const errDetails = extractErrorDetails(uri, diagnostic);

      if (errDetails) {
        // Get API key from settings
        const apiKey = getApiKey();

        const model_name = getModelName();

        if (!apiKey) {
          vscode.window.showErrorMessage(
            'CoachLint: Please set your Gemini API key first using "CoachLint: Set API Key" command.'
          );
          return null;
        }

        const response = await process_hover_error_message(errDetails, apiKey, model_name);

        const explanation = response.message;

        explanationCache.set(key, explanation);

        return explanation;
      }
    } catch (err) {
      console.log("Failed to get AI Explanation:", err);

      // Show user-friendly error message
      if (err.message.includes("API key") || err.message.includes("authentication")) {
        vscode.window.showErrorMessage("CoachLint: Authentication failed. Please check your API key.");
      } else {
        vscode.window.showErrorMessage("CoachLint: Failed to get AI explanation. Check your connection and API key.");
      }
    }

    return null;
  }

  context.subscriptions.push(OnErrorHoverExplanation);

  function extractErrorDetails(uri, diagnostic) {
    const document = vscode.workspace.textDocuments.find((doc) => doc.uri.toString() === uri.toString());

    if (!document) {
      return null;
    }

    const errorObj = {
      // Error details
      errorMessage: diagnostic.message,
      errorSource: diagnostic.source,
      errorCode: diagnostic.code,
      errorSeverity: diagnostic.severity,
      fileName: document.fileName,
      fileLanguage: document.languageId,
      lineNumber: diagnostic.range.start.line + 1,
      columnNumber: diagnostic.range.start.character + 1,

      errorLine: getErrorLine(document, diagnostic),
      surroundingCode: getSurroundingCode(document, diagnostic),

      timestamp: new Date().toISOString(),
      projectRoot: vscode.workspace.workspaceFolders?.[0]?.uri.path,
    };

    return errorObj;
  }

  function getErrorLine(document, diagnostic) {
    try {
      const lineIndex = diagnostic.range.start.line;
      const line = document.lineAt(lineIndex);

      return {
        number: lineIndex + 1,
        text: line.text,
        startChar: diagnostic.range.start.character,
        endChar: diagnostic.range.end.character,
        highlightedText: line.text.substring(diagnostic.range.start.character, diagnostic.range.end.character),
      };
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  function getSurroundingCode(document, diagnostic, contextLines = 5) {
    const errorLine = diagnostic.range.start.line;
    const startLine = Math.max(0, errorLine - contextLines);
    const endLine = Math.min(document.lineCount - 1, errorLine + contextLines);

    const codeLines = [];

    for (let i = startLine; i <= endLine; i++) {
      try {
        const line = document.lineAt(i);
        codeLines.push({
          number: i + 1,
          text: line.text,
          isErrorLine: i === errorLine,
          prefix: i === errorLine ? ">>> " : "    ",
        });
      } catch (error) {
        console.log(error);
      }
    }

    return codeLines;
  }

  const reviewCodeCommand = vscode.commands.registerCommand("coachlint.reviewCurrentFile", async () => {
    const activeEditor = vscode.window.activeTextEditor;

    if (!activeEditor) {
      vscode.window.showErrorMessage("No active Python file to review");
      return;
    }

    if (activeEditor.document.languageId !== "python") {
      vscode.window.showErrorMessage("Code review currently supports Python files only");
      return;
    }

    await reviewPythonFile(activeEditor);
  });

  context.subscriptions.push(reviewCodeCommand);

  async function reviewPythonFile(editor) {
    const code = editor.document.getText();
    const fileName = editor.document.fileName;

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "CoachLint is reviewing your code...",
        cancellable: false,
      },
      async () => {
        const reviewData = {
          code: code,
          fileName: fileName,
          fileLanguage: "python",
          timestamp: new Date().toISOString(),
        };

        try {
          const apiKey = getApiKey();
          const model_name = getModelName();
          if (!apiKey) {
            vscode.window.showErrorMessage(
              'CoachLint: Please set your Gemini API key first using "CoachLint: Set API Key" command.'
            );
            return;
          }

          const response = await process_code_review_message(reviewData, apiKey, model_name);

          displayCodeReview(response, fileName);
        } catch (error) {
          console.error("Code review error:", error);
          coachLintOutputChannel.appendLine("❌ Failed to get code review");
          coachLintOutputChannel.show(true);

          if (error.message.includes("API key") || error.message.includes("authentication")) {
            vscode.window.showErrorMessage("CoachLint: Authentication failed. Please check your API key.");
          } else {
            vscode.window.showErrorMessage("CoachLint: Failed to get code review. Check your connection and API key.");
          }
        }
      }
    );
  }

  function displayCodeReview(reviewResponse, fileName) {
    coachLintOutputChannel.clear();
    coachLintOutputChannel.appendLine("═══════════════════════════════════════");
    coachLintOutputChannel.appendLine("🔍 COACHLINT CODE REVIEW");
    coachLintOutputChannel.appendLine("═══════════════════════════════════════");
    coachLintOutputChannel.appendLine(`📁 File: ${fileName}`);
    coachLintOutputChannel.appendLine(`⏰ Analyzed: ${new Date().toLocaleString()}\n`);

    coachLintOutputChannel.appendLine(reviewResponse.message);
    coachLintOutputChannel.appendLine("\n═══════════════════════════════════════");

    coachLintOutputChannel.show(true);
  }
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
