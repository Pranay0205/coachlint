
const vscode = require('vscode');
const diagnosticExtractor = require("./diagnosticExtractor")

function activate(context) {
	const diagnosticCollection = vscode.languages.createDiagnosticCollection('coachlint');
  context.subscriptions.push(diagnosticCollection);

	const disposable = vscode.languages.onDidChangeDiagnostics(event => { 
		let errDetails;
		
		for (const uri of event.uris) {
				const diagnostics = vscode.languages.getDiagnostics(uri);

					diagnostics.forEach(diagnostic => {
					errDetails = diagnosticExtractor.extractErrorDetails(uri, diagnostic);
					diagnosticExtractor.logDiagnosticInput(errDetails)
				})
		}
  })

	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
