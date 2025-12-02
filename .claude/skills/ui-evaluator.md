---
name: ui-evaluator
description: Comprehensive UI/UX evaluation with Playwright for visual design, accessibility (WCAG), performance metrics, functionality testing, and responsive design. Use when evaluating web applications on localhost or any URL, checking accessibility compliance, testing user interactions, analyzing visual design consistency, measuring performance, or generating comprehensive UI audit reports with screenshots and actionable recommendations.
---

# UI Evaluator

Comprehensive UI/UX evaluation toolkit using Playwright for automated testing across multiple dimensions: visual design, accessibility, performance, functionality, and responsive behavior.

## Quick Start

### Comprehensive Evaluation
Run all tests at once with the main evaluation script:

```bash
python .claude/skills/ui-evaluator/scripts/evaluate_ui.py http://localhost:3000 ./results
```

This generates:
- Screenshots (desktop, mobile, tablet)
- Accessibility report (WCAG violations)
- Performance metrics (load times, Core Web Vitals)
- Functionality checks (forms, buttons, links)
- Design analysis (colors, fonts, spacing)

### Focused Testing

**Accessibility only:**
```bash
python .claude/skills/ui-evaluator/scripts/test_accessibility.py http://localhost:3000 ./a11y-results
```

**Visual design analysis:**
```bash
python .claude/skills/ui-evaluator/scripts/visual_testing.py analyze http://localhost:3000
```

**Visual regression baselines:**
```bash
python .claude/skills/ui-evaluator/scripts/visual_testing.py baseline http://localhost:3000
```

**Functionality testing:**
```bash
python .claude/skills/ui-evaluator/scripts/test_functionality.py http://localhost:3000
```

## Available Scripts

### 1. evaluate_ui.py
**Purpose**: All-in-one comprehensive UI evaluation

**Usage**: `python .claude/skills/ui-evaluator/scripts/evaluate_ui.py <url> [output_dir]`

**What it tests**:
- Page load performance (load time, TTFB, FCP)
- Accessibility violations (using axe-core)
- Visual design consistency (fonts, colors, layout shifts)
- Functional elements (forms, buttons, links, inputs)
- Responsive design (desktop, tablet, mobile screenshots)

**Output**:
- `evaluation-results.json` - Complete test results
- `desktop-screenshot.png` - Desktop view
- `mobile-screenshot.png` - Mobile view
- `tablet-screenshot.png` - Tablet view

### 2. test_accessibility.py
**Purpose**: Detailed WCAG 2.1 compliance testing

**Usage**: `python .claude/skills/ui-evaluator/scripts/test_accessibility.py <url> [output_dir]`

**What it tests**:
- WCAG violations (categorized by severity: critical, serious, moderate, minor)
- Color contrast ratios
- Keyboard navigation support
- ARIA usage
- Form labels and error associations
- Heading hierarchy
- Image alt text
- Focus management

**Output**:
- `accessibility-report.json` - Detailed violations with fixes
- Console report with prioritized issues

**Best practice**: Run this regularly during development to catch issues early.

### 3. visual_testing.py
**Purpose**: Visual design analysis and regression testing

**Commands**:
- `analyze` - Check design tokens and consistency
- `baseline` - Capture baseline screenshots for regression testing

**Usage**:
```bash
# Analyze design elements
python .claude/skills/ui-evaluator/scripts/visual_testing.py analyze http://localhost:3000

# Capture baselines
python .claude/skills/ui-evaluator/scripts/visual_testing.py baseline http://localhost:3000
```

**What it checks**:
- Color palette (flags if >20 unique colors)
- Typography (font families, sizes, inconsistencies)
- Spacing values
- Contrast ratios
- Cumulative Layout Shift (CLS)
- Design token consistency

**Output**:
- `visual-analysis.json` - Design token inventory
- `design-analysis.png` - Annotated screenshot
- Baseline screenshots for all viewports

### 4. test_functionality.py
**Purpose**: Functional behavior testing template

**Usage**: `python .claude/skills/ui-evaluator/scripts/test_functionality.py <url> [output_dir]`

**Built-in tests**:
- Page loads successfully
- Navigation links are clickable
- Forms have submit buttons
- Buttons are interactive
- No JavaScript errors
- Responsive layout works

**Customization**: Edit this script to add your specific tests:
```python
# Example: Test login flow
test_name = "Login form works"
try:
    page.fill("#username", "testuser")
    page.fill("#password", "testpass")
    page.click("#login-button")
    page.wait_for_selector("#dashboard")
    results["tests_passed"] += 1
except Exception as e:
    results["tests_failed"] += 1
```

**Output**:
- `functional-test-report.json` - Test results
- Screenshots of different viewports

## Workflow Recommendations

### Development Workflow
1. **Start development**: Run baseline captures
   ```bash
   python .claude/skills/ui-evaluator/scripts/visual_testing.py baseline http://localhost:3000
   ```

2. **During development**: Quick accessibility checks
   ```bash
   python .claude/skills/ui-evaluator/scripts/test_accessibility.py http://localhost:3000
   ```

3. **Before commits**: Run comprehensive evaluation
   ```bash
   python .claude/skills/ui-evaluator/scripts/evaluate_ui.py http://localhost:3000
   ```

4. **Custom tests**: Modify `test_functionality.py` for your app's specific workflows

### Pre-Production Checklist
- [ ] Run comprehensive evaluation (`evaluate_ui.py`)
- [ ] Fix all critical/serious accessibility issues
- [ ] Lighthouse score > 90
- [ ] No JavaScript errors
- [ ] Visual regression tests pass
- [ ] Custom functional tests pass
- [ ] Tested on real mobile devices

## Interpreting Results

### Accessibility Severity Levels

**Critical (⛔)**: Breaks experience for users with disabilities
- Fix immediately before deployment
- Examples: Missing alt text, no keyboard access, insufficient contrast

**Serious (🔴)**: Significant barriers
- Fix in current sprint
- Examples: Improper ARIA usage, missing form labels

**Moderate (🟡)**: Causes friction
- Fix soon
- Examples: Suboptimal focus indicators, minor contrast issues

**Minor (⚪)**: Best practice improvements
- Fix when convenient
- Examples: Redundant ARIA, non-descriptive link text

### Performance Benchmarks

**Good**:
- Load time: < 2 seconds
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1

**Needs Improvement**:
- Load time: 2-4 seconds
- LCP: 2.5-4s
- FID: 100-300ms
- CLS: 0.1-0.25

**Poor**:
- Load time: > 4 seconds
- LCP: > 4s
- FID: > 300ms
- CLS: > 0.25

### Visual Design Red Flags
- More than 20 unique colors (suggests no design system)
- More than 10 font sizes (suggests no type scale)
- More than 3 font families (usually unnecessary)
- High Cumulative Layout Shift score (> 0.1)

## Reference Documentation

For detailed standards and best practices, read the reference files:

**Accessibility**: `.claude/skills/ui-evaluator/references/wcag-standards.md`
- WCAG 2.1 compliance levels
- Common issues and fixes
- Testing checklist

**Visual Design**: `.claude/skills/ui-evaluator/references/design-best-practices.md`
- Color theory and palette guidelines
- Typography systems
- Spacing and layout principles
- Design consistency

**Performance**: `.claude/skills/ui-evaluator/references/performance-standards.md`
- Core Web Vitals targets
- Optimization strategies
- Performance budgets
- Mobile optimization

## Common Issues and Solutions

### "Module not found" errors
Install dependencies:
```bash
pip install playwright pytest-playwright axe-playwright-python
playwright install chromium
```

### "Navigation timeout" errors
Increase timeout or check if URL is accessible:
```python
page.goto(url, wait_until="networkidle", timeout=60000)  # 60 seconds
```

### Tests fail on localhost
Ensure your development server is running before testing.

### Need to test authenticated pages
Modify scripts to include login steps:
```python
page.goto("http://localhost:3000/login")
page.fill("#username", "testuser")
page.fill("#password", "testpass")
page.click("#login-button")
page.wait_for_selector("#dashboard")
# Now run tests
```

## Generating Reports

All scripts output JSON files that can be:
1. Committed to version control for tracking
2. Integrated into CI/CD pipelines
3. Parsed for custom reporting
4. Compared over time for regression detection

Example: Compare accessibility over time:
```python
import json
from pathlib import Path

results = []
for file in Path("./accessibility-history").glob("*.json"):
    with open(file) as f:
        data = json.load(f)
        results.append({
            "date": file.stem,
            "violations": data["summary"]["total_violations"]
        })

# Plot trend or fail if violations increase
```

## Best Practices

1. **Test early and often**: Run tests during development, not just at the end
2. **Fix by priority**: Critical accessibility issues first, then performance, then visual
3. **Automate in CI/CD**: Run tests on every pull request
4. **Track trends**: Keep historical results to prevent regression
5. **Test on real devices**: Automated tests catch ~70% of issues
6. **Use reference docs**: Understand WHY issues matter, not just THAT they exist
7. **Customize functional tests**: Generic tests are a starting point only
