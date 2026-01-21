# Visual Design Best Practices

## Color Theory

### Color Palette Guidelines
- **Primary color**: 1 main brand color
- **Secondary colors**: 2-3 complementary colors
- **Neutral colors**: 2-5 shades of gray
- **Semantic colors**: Success (green), warning (yellow), error (red), info (blue)
- **Total unique colors**: Aim for 8-12 total colors maximum

### Color Usage
- Use 60-30-10 rule: 60% dominant, 30% secondary, 10% accent
- Ensure sufficient contrast for readability
- Consider colorblind users (test with simulators)
- Don't rely on color alone to convey information

## Typography

### Font Selection
- **Maximum fonts**: 2-3 font families
- **Body text**: Sans-serif (web) or serif (long-form)
- **Headings**: Sans-serif for modern, serif for traditional
- **Monospace**: Code and data

### Type Scale
Use a consistent scale (e.g., 1.25 ratio):
- h1: 2.5rem (40px)
- h2: 2rem (32px)
- h3: 1.5rem (24px)
- h4: 1.25rem (20px)
- Body: 1rem (16px)
- Small: 0.875rem (14px)

### Readability
- **Line height**: 1.5-1.6 for body text
- **Line length**: 45-75 characters ideal
- **Font size**: Minimum 16px for body text
- **Letter spacing**: Slight increase for all caps

## Spacing and Layout

### Spacing System
Use consistent spacing scale (8px base):
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px

### Layout Principles
- **White space**: Don't fear emptiness, it improves readability
- **Alignment**: Use a grid system (12-column common)
- **Proximity**: Group related elements
- **Hierarchy**: Size, color, position indicate importance

### Responsive Breakpoints
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px - 1439px
- Large desktop: 1440px+

## Visual Hierarchy

### Creating Hierarchy
1. **Size**: Larger = more important
2. **Weight**: Bold = more important
3. **Color**: High contrast = draws attention
4. **Position**: Top-left processed first (Western users)
5. **Spacing**: More space = more importance

### F-Pattern and Z-Pattern
- **F-Pattern**: Users scan content heavy pages
- **Z-Pattern**: Users scan simple pages with CTAs
- Place key information in these hot zones

## Design Consistency Issues

### Common Problems
- Too many font sizes
- Inconsistent spacing
- Too many colors
- Conflicting styles
- No clear visual hierarchy

### Solutions
- Create a design system/style guide
- Document all design tokens
- Use CSS variables or design tokens
- Regular design reviews
- Automated linting tools

## Performance Considerations

### Images
- Use appropriate formats (WebP, AVIF for photos)
- Optimize file sizes
- Use lazy loading
- Provide responsive images

### Fonts
- Limit font weights loaded
- Use font-display: swap
- Consider system fonts
- Subset fonts if using special characters

## Accessibility in Design

### Color
- 4.5:1 contrast for normal text
- 3:1 for large text and UI components
- Don't use red-green only combinations

### Typography
- Minimum 16px font size
- Allow text resizing
- Use relative units (rem, em)

### Interactive Elements
- Minimum 44x44px touch targets
- Visible focus states
- Clear hover states

## Dark Mode

### Best Practices
- Don't just invert colors
- Reduce contrast slightly (not pure white on pure black)
- Adjust shadows and elevation
- Test both modes thoroughly

### Color Adjustments
- Background: #121212 not #000000
- Text: #E0E0E0 not #FFFFFF
- Reduce saturation of accent colors
