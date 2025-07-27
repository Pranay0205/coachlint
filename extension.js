const vscode = require('vscode');
const apiwrapper = require('./apiwrapper')

function activate(context) {

	// Cache explanations to avoid re-generating
	const explanationCache = new Map();

	// Command to set API key
	const setApiKeyCommand = vscode.commands.registerCommand('coachlint.setApiKey', async () => {
		const apiKey = await vscode.window.showInputBox({
			prompt: 'Enter your API key for CoachLint',
			password: true, // Hide the input for security
			placeHolder: 'your-api-key-here',
			validateInput: (value) => {
				if (!value || value.trim().length === 0) {
					return 'API key cannot be empty';
				}
				if (value.length < 10) {
					return 'API key seems too short';
				}
				return null;
			}
		});

		if (apiKey) {
			// Store the API key in VS Code settings
			await vscode.workspace.getConfiguration('coachlint').update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
			
			vscode.window.showInformationMessage('✅ API key saved successfully!');
			
			// Clear cache when API key changes
			explanationCache.clear();
		}
	});

	// Command to show current API key status
	const showApiKeyStatusCommand = vscode.commands.registerCommand('coachlint.showApiKeyStatus', async () => {
		const apiKey = getApiKey();
		
		if (apiKey) {
			const maskedKey = apiKey.substring(0, 8) + '...';
			vscode.window.showInformationMessage(`🔑 API key is set: ${maskedKey}`);
		} else {
			const action = await vscode.window.showWarningMessage(
				'No API key set. CoachLint won\'t work without an API key.',
				'Set API Key'
			);
			
			if (action === 'Set API Key') {
				vscode.commands.executeCommand('coachlint.setApiKey');
			}
		}
	});

	// Command to clear API key
	const clearApiKeyCommand = vscode.commands.registerCommand('coachlint.clearApiKey', async () => {
		const confirm = await vscode.window.showWarningMessage(
			'Are you sure you want to clear the API key?',
			'Yes', 'No'
		);

		if (confirm === 'Yes') {
			await vscode.workspace.getConfiguration('coachlint').update('apiKey', undefined, vscode.ConfigurationTarget.Global);
			explanationCache.clear();
			vscode.window.showInformationMessage('🗑️ API key cleared');
		}
	});

	context.subscriptions.push(setApiKeyCommand, showApiKeyStatusCommand, clearApiKeyCommand);

	// Helper function to get API key
	function getApiKey() {
		return vscode.workspace.getConfiguration('coachlint').get('apiKey');
	}

	// On Hover error explanation
	const commandOnHover = vscode.languages.registerHoverProvider('*', {
		async provideHover(document, position){
			const diagnostics = vscode.languages.getDiagnostics(document.uri)

			const diagnostic = diagnostics.find(d => d.range.contains(position))
			
			if (diagnostic) {
				const aiExplanation = await getGeneratedExplanation(diagnostic, document.uri)

				if (aiExplanation){
					const markdown = new vscode.MarkdownString()

					markdown.appendMarkdown(`**🤖 AI Explanation:**\n\n ${aiExplanation}`)
					markdown.appendMarkdown(`\n\n----\n\n**Original Error:** ${diagnostic.message}`)

					return new vscode.Hover(markdown)
				}
			}

			return null
		}

	})

	async function getGeneratedExplanation(diagnostic, uri){

		const key = `${uri.toString()}-${diagnostic.message}`;
		
		if (explanationCache.has(key)) {
			return explanationCache.get(key)
		}

		try {
			const errDetails = extractErrorDetails(uri, diagnostic)

			if (errDetails) {
				// Get API key from settings (optional)
				const apiKey = getApiKey();

				const response = await apiwrapper.postHoverError(errDetails, apiKey)

				const explanation = response.message

				explanationCache.set(key, explanation)

				return explanation
			}
		}
		catch (err){
			console.log("Failed to get AI Explanation:", err)
			
			// Show user-friendly error message
			if (err.message.includes('401') || err.message.includes('403')) {
				vscode.window.showErrorMessage('CoachLint: Authentication failed. You may need to set an API key.');
			} else {
				vscode.window.showErrorMessage('CoachLint: Failed to get AI explanation. Check your connection.');
			}
		}

		return null
	}

	context.subscriptions.push(commandOnHover);

	function extractErrorDetails(uri, diagnostic) {
		const document = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === uri.toString());

		if(!document){
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
			projectRoot: vscode.workspace.workspaceFolders?.[0]?.uri.path
		};

		return errorObj
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
				highlightedText: line.text.substring(
					diagnostic.range.start.character,
					diagnostic.range.end.character
				)
			};
		} catch (error) {
			console.log(error)
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
					prefix: i === errorLine ? '>>> ' : '    '
				});
			} catch (error) {
				console.log(error)
			}
		}
		
		return codeLines;
	}
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}