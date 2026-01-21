#!/usr/bin/env python3
"""
Visual Regression Testing Script
Captures screenshots and compares them to baselines to detect visual changes.
"""

import sys
from pathlib import Path
from playwright.sync_api import sync_playwright
import json

def capture_visual_baseline(url: str, output_dir: str = "./visual-baselines"):
    """
    Capture baseline screenshots for visual regression testing.
    
    Args:
        url: The URL to capture
        output_dir: Directory to save baseline images
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    viewports = {
        "desktop-1920": {"width": 1920, "height": 1080},
        "desktop-1366": {"width": 1366, "height": 768},
        "tablet-portrait": {"width": 768, "height": 1024},
        "tablet-landscape": {"width": 1024, "height": 768},
        "mobile-375": {"width": 375, "height": 667},
        "mobile-414": {"width": 414, "height": 896},
    }
    
    results = {"url": url, "captures": {}}
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        print(f"📸 Capturing visual baselines for: {url}\n")
        
        for name, viewport in viewports.items():
            try:
                page = browser.new_page(viewport=viewport)
                page.goto(url, wait_until="networkidle", timeout=30000)
                
                # Wait for any animations to complete
                page.wait_for_timeout(500)
                
                # Capture full page screenshot
                screenshot_path = output_path / f"{name}.png"
                page.screenshot(path=str(screenshot_path), full_page=True)
                
                # Capture viewport-only screenshot
                viewport_path = output_path / f"{name}-viewport.png"
                page.screenshot(path=str(viewport_path), full_page=False)
                
                results["captures"][name] = {
                    "viewport": viewport,
                    "full_page": str(screenshot_path),
                    "viewport_only": str(viewport_path)
                }
                
                print(f"✓ Captured {name} ({viewport['width']}x{viewport['height']})")
                
                page.close()
                
            except Exception as e:
                results["captures"][name] = {"error": str(e)}
                print(f"✗ Failed to capture {name}: {e}")
        
        browser.close()
    
    # Save metadata
    metadata_file = output_path / "baseline-metadata.json"
    with open(metadata_file, "w") as f:
        json.dump(results, indent=2, fp=f)
    
    print(f"\n✅ Baselines captured! Saved to: {output_dir}")
    print(f"📄 Metadata: {metadata_file}")
    
    return results


def check_visual_elements(url: str, output_dir: str = "./visual-check-results"):
    """
    Check visual design elements like colors, spacing, typography.
    
    Args:
        url: The URL to check
        output_dir: Directory to save results
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    results = {"url": url, "design_tokens": {}, "issues": []}
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        print(f"🎨 Analyzing visual design at: {url}\n")
        
        try:
            page.goto(url, wait_until="networkidle", timeout=30000)
            
            # Extract design tokens
            design_analysis = page.evaluate("""() => {
                const elements = document.querySelectorAll('*');
                const colors = new Set();
                const fonts = new Set();
                const fontSizes = new Set();
                const spacing = new Set();
                
                elements.forEach(el => {
                    const style = window.getComputedStyle(el);
                    
                    // Colors
                    if (style.color) colors.add(style.color);
                    if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                        colors.add(style.backgroundColor);
                    }
                    
                    // Typography
                    if (style.fontFamily) fonts.add(style.fontFamily);
                    if (style.fontSize) fontSizes.add(style.fontSize);
                    
                    // Spacing
                    if (style.margin && style.margin !== '0px') spacing.add(style.margin);
                    if (style.padding && style.padding !== '0px') spacing.add(style.padding);
                });
                
                return {
                    colors: Array.from(colors),
                    fonts: Array.from(fonts),
                    fontSizes: Array.from(fontSizes),
                    spacing: Array.from(spacing)
                };
            }""")
            
            results["design_tokens"] = design_analysis
            
            print("📊 Design Token Analysis:")
            print(f"   Colors used: {len(design_analysis['colors'])}")
            print(f"   Font families: {len(design_analysis['fonts'])}")
            print(f"   Font sizes: {len(design_analysis['fontSizes'])}")
            print(f"   Spacing values: {len(design_analysis['spacing'])}")
            
            # Check for design consistency issues
            if len(design_analysis['colors']) > 20:
                results["issues"].append({
                    "type": "warning",
                    "category": "colors",
                    "message": f"High color count ({len(design_analysis['colors'])}). Consider using a consistent color palette."
                })
                print("\n⚠️  Warning: Many different colors used (consider design system)")
            
            if len(design_analysis['fontSizes']) > 10:
                results["issues"].append({
                    "type": "warning",
                    "category": "typography",
                    "message": f"High font size count ({len(design_analysis['fontSizes'])}). Consider using a type scale."
                })
                print("⚠️  Warning: Many font sizes (consider type scale)")
            
            if len(design_analysis['fonts']) > 3:
                results["issues"].append({
                    "type": "info",
                    "category": "typography",
                    "message": f"Multiple font families ({len(design_analysis['fonts'])}). This may be intentional."
                })
                print(f"ℹ️  Info: {len(design_analysis['fonts'])} font families in use")
            
            # Check for contrast issues (sample check)
            contrast_issues = page.evaluate("""() => {
                const issues = [];
                const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, label');
                
                function getLuminance(color) {
                    const rgb = color.match(/\\d+/g);
                    if (!rgb) return 1;
                    const [r, g, b] = rgb.map(x => {
                        x = x / 255;
                        return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
                    });
                    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
                }
                
                function getContrastRatio(l1, l2) {
                    const lighter = Math.max(l1, l2);
                    const darker = Math.min(l1, l2);
                    return (lighter + 0.05) / (darker + 0.05);
                }
                
                for (let i = 0; i < Math.min(textElements.length, 100); i++) {
                    const el = textElements[i];
                    const style = window.getComputedStyle(el);
                    const textColor = style.color;
                    const bgColor = style.backgroundColor;
                    
                    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
                        const textLum = getLuminance(textColor);
                        const bgLum = getLuminance(bgColor);
                        const ratio = getContrastRatio(textLum, bgLum);
                        
                        const fontSize = parseFloat(style.fontSize);
                        const isLargeText = fontSize >= 18 || (fontSize >= 14 && style.fontWeight >= 700);
                        const minRatio = isLargeText ? 3 : 4.5;
                        
                        if (ratio < minRatio) {
                            issues.push({
                                element: el.tagName,
                                ratio: ratio.toFixed(2),
                                required: minRatio
                            });
                        }
                    }
                }
                
                return issues.slice(0, 5); // Return first 5 issues
            }""")
            
            if contrast_issues:
                print(f"\n⚠️  Potential contrast issues found: {len(contrast_issues)} elements")
                for issue in contrast_issues:
                    results["issues"].append({
                        "type": "warning",
                        "category": "contrast",
                        "message": f"{issue['element']} has ratio {issue['ratio']}:1 (needs {issue['required']}:1)"
                    })
            
            # Take annotated screenshot
            screenshot_path = output_path / "design-analysis.png"
            page.screenshot(path=str(screenshot_path), full_page=True)
            results["screenshot"] = str(screenshot_path)
            
        except Exception as e:
            results["error"] = str(e)
            print(f"❌ Error during analysis: {e}")
        
        browser.close()
    
    # Save results
    results_file = output_path / "visual-analysis.json"
    with open(results_file, "w") as f:
        json.dump(results, indent=2, fp=f)
    
    print(f"\n✅ Visual analysis complete! Results saved to: {output_dir}")
    
    return results


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python visual_testing.py <command> <url> [output_dir]")
        print("\nCommands:")
        print("  baseline    - Capture baseline screenshots")
        print("  analyze     - Analyze visual design elements")
        print("\nExamples:")
        print("  python visual_testing.py baseline http://localhost:3000")
        print("  python visual_testing.py analyze http://localhost:3000")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "baseline":
        if len(sys.argv) < 3:
            print("Error: URL required for baseline command")
            sys.exit(1)
        url = sys.argv[2]
        output_dir = sys.argv[3] if len(sys.argv) > 3 else "./visual-baselines"
        capture_visual_baseline(url, output_dir)
    
    elif command == "analyze":
        if len(sys.argv) < 3:
            print("Error: URL required for analyze command")
            sys.exit(1)
        url = sys.argv[2]
        output_dir = sys.argv[3] if len(sys.argv) > 3 else "./visual-check-results"
        check_visual_elements(url, output_dir)
    
    else:
        print(f"Unknown command: {command}")
        print("Available commands: baseline, analyze")
        sys.exit(1)
