#!/usr/bin/env python3
"""
Comprehensive UI Evaluation Script
Performs visual, accessibility, performance, and functionality checks on a web application.
"""

import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright
from axe_playwright_python.sync_playwright import Axe
import time

def evaluate_ui(url: str, output_dir: str = "./ui-evaluation-results"):
    """
    Perform comprehensive UI evaluation on a given URL.
    
    Args:
        url: The URL to evaluate (e.g., http://localhost:3000)
        output_dir: Directory to save results and screenshots
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    results = {
        "url": url,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "visual": {},
        "accessibility": {},
        "performance": {},
        "functionality": {},
        "responsive": {}
    }
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # Test on desktop viewport
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        
        print(f"📊 Evaluating UI at: {url}")
        print("=" * 60)
        
        # Navigate to page and measure load time
        print("\n⏱️  Performance Testing...")
        start_time = time.time()
        try:
            page.goto(url, wait_until="networkidle", timeout=30000)
            load_time = time.time() - start_time
            results["performance"]["load_time"] = round(load_time, 2)
            print(f"   ✓ Page load time: {results['performance']['load_time']}s")
        except Exception as e:
            results["performance"]["error"] = str(e)
            print(f"   ✗ Failed to load page: {e}")
            browser.close()
            return results
        
        # Visual/Design Evaluation
        print("\n🎨 Visual/Design Evaluation...")
        page.screenshot(path=str(output_path / "desktop-screenshot.png"), full_page=True)
        print(f"   ✓ Screenshot saved: desktop-screenshot.png")
        
        # Check color contrast
        results["visual"]["screenshot"] = "desktop-screenshot.png"
        
        # Get computed styles for design consistency checks
        try:
            fonts = page.evaluate("""() => {
                const elements = document.querySelectorAll('*');
                const fonts = new Set();
                elements.forEach(el => {
                    const font = window.getComputedStyle(el).fontFamily;
                    if (font) fonts.add(font);
                });
                return Array.from(fonts);
            }""")
            results["visual"]["fonts_used"] = fonts
            print(f"   ✓ Fonts detected: {len(fonts)} different font families")
        except Exception as e:
            results["visual"]["fonts_error"] = str(e)
        
        # Check for layout shifts
        try:
            cls_score = page.evaluate("""() => {
                return new Promise((resolve) => {
                    let cls = 0;
                    new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (!entry.hadRecentInput) {
                                cls += entry.value;
                            }
                        }
                        resolve(cls);
                    }).observe({type: 'layout-shift', buffered: true});
                    setTimeout(() => resolve(cls), 1000);
                });
            }""")
            results["visual"]["cumulative_layout_shift"] = cls_score
            print(f"   ✓ Cumulative Layout Shift: {cls_score}")
        except Exception as e:
            results["visual"]["cls_error"] = str(e)
        
        # Accessibility Testing
        print("\n♿ Accessibility Testing...")
        try:
            axe = Axe()
            axe.inject(page)
            a11y_results = axe.run(page)
            
            violations = a11y_results.get("violations", [])
            results["accessibility"]["violations_count"] = len(violations)
            results["accessibility"]["violations"] = [
                {
                    "id": v["id"],
                    "impact": v.get("impact", "unknown"),
                    "description": v["description"],
                    "help": v["help"],
                    "nodes_affected": len(v.get("nodes", []))
                }
                for v in violations
            ]
            
            if violations:
                print(f"   ⚠️  Found {len(violations)} accessibility issues:")
                for v in violations[:5]:  # Show first 5
                    print(f"      - {v['impact'].upper()}: {v['description']}")
                if len(violations) > 5:
                    print(f"      ... and {len(violations) - 5} more issues")
            else:
                print("   ✓ No accessibility violations found!")
            
        except Exception as e:
            results["accessibility"]["error"] = str(e)
            print(f"   ✗ Accessibility test failed: {e}")
        
        # Functionality Testing
        print("\n⚙️  Functionality Testing...")
        
        # Check for forms
        try:
            forms = page.locator("form").count()
            results["functionality"]["forms_count"] = forms
            print(f"   ✓ Forms found: {forms}")
            
            # Check for buttons
            buttons = page.locator("button, input[type='button'], input[type='submit']").count()
            results["functionality"]["buttons_count"] = buttons
            print(f"   ✓ Buttons found: {buttons}")
            
            # Check for links
            links = page.locator("a").count()
            results["functionality"]["links_count"] = links
            print(f"   ✓ Links found: {links}")
            
            # Check for interactive elements
            interactive = page.locator("input, select, textarea").count()
            results["functionality"]["interactive_elements"] = interactive
            print(f"   ✓ Interactive elements: {interactive}")
            
        except Exception as e:
            results["functionality"]["error"] = str(e)
        
        # Responsive Design Testing
        print("\n📱 Responsive Design Testing...")
        
        viewports = {
            "mobile": {"width": 375, "height": 667},
            "tablet": {"width": 768, "height": 1024},
        }
        
        for device, viewport in viewports.items():
            try:
                page.set_viewport_size(viewport)
                page.wait_for_timeout(500)  # Let page adjust
                screenshot_name = f"{device}-screenshot.png"
                page.screenshot(path=str(output_path / screenshot_name))
                results["responsive"][device] = {
                    "viewport": viewport,
                    "screenshot": screenshot_name
                }
                print(f"   ✓ {device.capitalize()} screenshot saved")
            except Exception as e:
                results["responsive"][device] = {"error": str(e)}
        
        # Performance Metrics
        print("\n📊 Performance Metrics...")
        try:
            metrics = page.evaluate("""() => {
                const perfData = window.performance.timing;
                const paintData = performance.getEntriesByType('paint');
                return {
                    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
                    domInteractive: perfData.domInteractive - perfData.navigationStart,
                    firstPaint: paintData.find(x => x.name === 'first-paint')?.startTime || 0,
                    firstContentfulPaint: paintData.find(x => x.name === 'first-contentful-paint')?.startTime || 0
                };
            }""")
            results["performance"]["metrics"] = metrics
            print(f"   ✓ DOM Content Loaded: {metrics.get('domContentLoaded', 0)}ms")
            print(f"   ✓ First Contentful Paint: {metrics.get('firstContentfulPaint', 0)}ms")
        except Exception as e:
            results["performance"]["metrics_error"] = str(e)
        
        browser.close()
    
    # Save results to JSON
    results_file = output_path / "evaluation-results.json"
    with open(results_file, "w") as f:
        json.dump(results, indent=2, fp=f)
    
    print(f"\n✅ Evaluation complete! Results saved to: {output_dir}")
    print(f"📄 Detailed results: {results_file}")
    
    return results


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python evaluate_ui.py <url> [output_dir]")
        print("Example: python evaluate_ui.py http://localhost:3000 ./results")
        sys.exit(1)
    
    url = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "./ui-evaluation-results"
    
    results = evaluate_ui(url, output_dir)
    
    # Print summary
    print("\n" + "=" * 60)
    print("📋 EVALUATION SUMMARY")
    print("=" * 60)
    print(f"URL: {results['url']}")
    print(f"Load Time: {results['performance'].get('load_time', 'N/A')}s")
    print(f"Accessibility Issues: {results['accessibility'].get('violations_count', 'N/A')}")
    print(f"Forms: {results['functionality'].get('forms_count', 'N/A')}")
    print(f"Interactive Elements: {results['functionality'].get('interactive_elements', 'N/A')}")
    print("=" * 60)
