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
    console.log('=== DIAGNOSTIC INPUT ===');
    console.log('Error:', input.errorMessage);
    console.log('Source:', input.errorSource);
    console.log('Language:', input.fileLanguage);
    console.log('File:', input.fileName);
    console.log('Line:', input.lineNumber);
    
    console.log('\nError line:');
    console.log(`${input.errorLine.number}: ${input.errorLine.text}`);
    console.log('Highlighted:', input.errorLine.highlightedText);
    
    console.log('\nSurrounding code:');
    input.surroundingCode.forEach(line => {
        console.log(`${line.prefix}${line.number}: ${line.text}`);
    });
    
    console.log('========================');
}