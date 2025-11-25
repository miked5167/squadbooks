# Test Fixtures

This directory contains sample files and data used in automated tests.

## Files

### sample-receipt.pdf
A sample PDF receipt for testing file upload functionality.

To create a sample receipt for testing:
1. Create any PDF file with receipt-like content
2. Name it `sample-receipt.pdf`
3. Place it in this directory

For testing purposes, you can use any small PDF file (<5MB).

## Usage in Tests

```typescript
// In Playwright tests
await page.setInputFiles('input[type="file"]', 'tests/fixtures/sample-receipt.pdf');
```

## Adding New Fixtures

When adding new test fixtures:
1. Keep files small (<1MB preferred)
2. Use descriptive names
3. Document in this README
4. Never commit sensitive data
