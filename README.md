
![CoachLint Logo](images/logo.png)

# CoachLint - Your AI Programming Coach

[Boot.dev Hackathon](https://blog.boot.dev/news/hackathon-2025/)

![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Google Gemini](https://img.shields.io/badge/google%20gemini-8E75B2?style=for-the-badge&logo=google%20gemini&logoColor=white)
![Visual Studio Code](https://img.shields.io/badge/Visual%20Studio%20Code-0078d7.svg?style=for-the-badge&logo=visual-studio-code&logoColor=white)

CoachLint is your AI coding coach. It guides you through errors instead of ***just solving them for you.***

## My Motivation

Developers are becoming increasingly dependent on quick code fixes and instant code generation. When we use external AI tools, there's no middle ground - the AI just gives you the answer. People copy-paste solutions without understanding the **why** behind them.

This approach makes us lose the core skill that makes a software engineer valuable: **understanding the problem and solving it systematically**.

**AI is best for breaking down complex errors into very easy and understandable explanations.** I believe CoachLint will help developers learn more deeply instead of developing shallow programming skills.

## Features

- **Error Explanations** - Hover over errors for plain English explanations
- **Code Quality Review** - Get improvement suggestions for your Python code
- **Educational Focus** - Learn concepts, not just quick fixes

## Setup

### API Key Configuration
1. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Open Command Palette (`Ctrl+Shift+P`)
3. Type `CoachLint: Set API Key`
4. Enter your API key securely

> API key is stored securely in the vscode configurations. Remove the key once done, using *CoachLint: Clear API Key* command

## Usage

### Hover Error Explanations
1. Write Python code with errors
2. **Hover** over red squiggly lines
3. Get instant AI explanation

### Code Quality Review
1. Open any Python file
2. Press `Ctrl+Shift+P` → "CoachLint: Review Current File"
3. Get suggestions in output panel

## Commands

- `CoachLint: Set API Key` - Configure API key
- `CoachLint: Review Current File` - Get code suggestions
- `CoachLint: Show API Key Status` - Check configuration
- `CoachLint: Clear API Key` - Remove stored API key

# Demo Screenshots

## Hovering over the error

### Example 1
![hover over error sample 1](images/demo/hover_error.png)

### Example 2
![hover over error sample 2](images/demo/hover_error2.png)


## Code Review Command

### Example 1

![Code Review Example 1](images/demo/code_review.png)

### Example 2
![Code Review Example 2](images/demo/code_review2.png)
## Boot.dev Hackathon

Thank you, [Boot.dev](https://www.boot.dev), for hosting this event and your amazing content!

---

### Remember: The goal isn't to fix your code faster - it's to make you a better programmer.