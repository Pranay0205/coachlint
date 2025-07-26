# 🤖 Coachlint

> AI-powered VS Code extension that explains compiler errors in simple terms

**Status**: Work in Progress 🚧

## What it does

Transforms cryptic compiler errors into human-readable explanations using AI.

```diff
- Cannot find name 'undefinedVariable'
+ 🤖 You're using a variable that doesn't exist. Check the spelling or declare it first.
```

## Features

- ✅ Detects compilation errors from Python, Go 
- ✅ Extracts error context and surrounding code
- 🔄 AI explanations using Google Gemini (in progress)
- ⏳ Interactive error help

## Development

```bash
git clone <repo>
npm install
code .
# Press F5 to run
```

## Testing

Create files with errors:
```python
// test.py
# Creates error for testing
print(undefined_variable)  # Runtime error
def test():
    return 1 + "string"    # Type error
```

Check console for diagnostic extraction logs.

## License

MIT