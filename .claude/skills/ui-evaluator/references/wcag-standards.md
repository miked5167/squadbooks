# Web Accessibility Standards Reference

## WCAG 2.1 Guidelines Overview

### Level A (Minimum)
Must meet these for basic accessibility:
- Text alternatives for non-text content
- Captions for audio/video
- Content can be presented in different ways
- Color is not the only visual means of conveying information
- Keyboard accessible
- Users have enough time to read and use content
- No content causes seizures (no flashing more than 3 times/second)
- Navigation mechanisms are consistent

### Level AA (Recommended)
Industry standard for most applications:
- Captions for live audio content
- Audio descriptions for video
- Minimum contrast ratio of 4.5:1 (3:1 for large text)
- Text can be resized up to 200%
- Images of text avoided (use real text)
- Multiple ways to navigate
- Headings and labels describe purpose
- Visible keyboard focus
- Link purpose clear from text or context

### Level AAA (Enhanced)
Gold standard, not required for all content:
- Sign language for audio content
- Extended audio descriptions
- Contrast ratio of at least 7:1
- Text spacing can be adjusted
- No time limits
- Re-authentication without data loss

## Common Accessibility Issues and Fixes

### Images
**Issue**: Missing alt text
**Fix**: `<img src="photo.jpg" alt="Person hiking on mountain trail">`

**Issue**: Decorative images with alt text
**Fix**: `<img src="decoration.svg" alt="" role="presentation">`

### Forms
**Issue**: Inputs without labels
**Fix**:
```html
<label for="email">Email Address</label>
<input type="email" id="email" name="email">
```

**Issue**: No error messages
**Fix**: Use aria-describedby to associate errors
```html
<input id="email" aria-describedby="email-error">
<span id="email-error" role="alert">Please enter valid email</span>
```

### Buttons and Links
**Issue**: Non-descriptive link text ("click here")
**Fix**: Use descriptive text ("Download annual report PDF")

**Issue**: Buttons without accessible names
**Fix**: `<button aria-label="Close dialog">×</button>`

### Headings
**Issue**: Skipping heading levels (h1 → h3)
**Fix**: Use proper hierarchy (h1 → h2 → h3)

**Issue**: Multiple h1 elements
**Fix**: Only one h1 per page (usually the main title)

### Color Contrast
**Issue**: Insufficient contrast
**Fix**: Use these minimum ratios:
- Normal text: 4.5:1
- Large text (18pt+ or 14pt+ bold): 3:1
- UI components: 3:1

**Tools**: WebAIM Contrast Checker, browser DevTools

### Keyboard Navigation
**Issue**: Trapped focus
**Fix**: Ensure Tab and Shift+Tab work properly, provide keyboard escape

**Issue**: No visible focus indicator
**Fix**: Style :focus states clearly
```css
button:focus {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
}
```

### ARIA Usage
**Do**:
- Use native HTML elements when possible
- Use ARIA to enhance, not replace, semantics
- Test with screen readers

**Don't**:
- Use ARIA role="button" on a `<button>` (redundant)
- Use ARIA to fix badly structured HTML
- Hide important content with aria-hidden="true"

## Testing Checklist

- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Headings in logical order
- [ ] Color contrast meets WCAG AA
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] No keyboard traps
- [ ] Screen reader announces content correctly
- [ ] Error messages are clear and associated
- [ ] Time limits can be extended
- [ ] Videos have captions
- [ ] Content reflows at 200% zoom
