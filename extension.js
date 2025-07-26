const vscode = require('vscode');
const apiwrapper = require('./apiwrapper')

function activate(context) {
	const diagnosticCollection = vscode.languages.createDiagnosticCollection('coachlint');
	context.subscriptions.push(diagnosticCollection);

	// Auto-process when diagnostics change (first time)
	const disposable = vscode.languages.onDidChangeDiagnostics(event => { 
		processAllErrors(event.uris);
	});

	// Manual command to re-process current file errors
	const commandDisposable = vscode.commands.registerCommand('coachlint.explainCurrentErrors', () => {
		console.log('Manual error explanation triggered');
		
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			processAllErrors([activeEditor.document.uri]);
		} else {
			vscode.window.showInformationMessage('No active file to analyze');
		}
	});

	function processAllErrors(uris) {
		for (const uri of uris) {
			const diagnostics = vscode.languages.getDiagnostics(uri);

			// Filter for ACTUAL compilation/runtime errors only
			const realErrors = diagnostics.filter(diagnostic => {
				return isCompilationOrRuntimeError(diagnostic);
			});

			if (realErrors.length > 0) {
				console.log(`🚨 Found ${realErrors.length} compilation/runtime errors`);
				
				realErrors.forEach(diagnostic => {
					const errDetails = extractErrorDetails(uri, diagnostic);
					
					if (errDetails) {
						logDiagnosticInput(errDetails);
						
						try {
							// Send each error individually
							apiwrapper.postErrorDetails(errDetails);
							console.log('✅ Sent error to API');
						} catch (error) {
							console.log('❌ Failed to send to API:', error.message);
						}
					}
				});
			}
		}
	}

	function isCompilationOrRuntimeError(diagnostic) {

		if (diagnostic.severity !== vscode.DiagnosticSeverity.Error) {
			return false;
		}

		// Skip own diagnostics
		if (diagnostic.source === 'coachlint') {
			return false;
		}

		// Filter by error message keywords (compilation/runtime errors)
		const message = diagnostic.message.toLowerCase();
		const errorKeywords = [
			'cannot find', 'not found',
			'undefined', 'not defined',
			'undeclared', 'unresolved',
			'syntax error', 'parse error',
			'type error', 'type mismatch',
			'reference error',
			'name error', 'attribute error',
			'compilation error', 'build error',
			'does not exist',
			'missing import', 'import error',
			'no such file', 'file not found'
		];

		const hasErrorKeywords = errorKeywords.some(keyword => message.includes(keyword));
		
		return hasErrorKeywords;
	}

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

	function logDiagnosticInput(input) {
		if (!input) {
			console.log('=== NO INPUT TO LOG ===');
			return;
		}

		console.log('=== COMPILATION/RUNTIME ERROR ===');
		console.log('Error:', input.errorMessage);
		console.log('Source:', input.errorSource);
		console.log('Language:', input.fileLanguage);
		console.log('File:', input.fileName);
		console.log('Line:', input.lineNumber);
		
		if (input.errorLine) {
			console.log('\nError line:');
			console.log(`${input.errorLine.number}: ${input.errorLine.text}`);
			console.log('Highlighted:', input.errorLine.highlightedText);
		}
		
		if (input.surroundingCode) {
			console.log('\nSurrounding code:');
			input.surroundingCode.forEach(line => {
				console.log(`${line.prefix}${line.number}: ${line.text}`);
			});
		}
		
		console.log('====================================');
	}
	context.subscriptions.push(disposable);
	context.subscriptions.push(commandDisposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}