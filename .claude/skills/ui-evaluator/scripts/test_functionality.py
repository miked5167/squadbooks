#!/usr/bin/env python3
"""
Functional Testing Template
Template for testing user interactions, forms, navigation, and application behavior.
Customize this script for your specific application needs.
"""

import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import json

def test_functionality(url: str, output_dir: str = "./functional-test-results"):
    """
    Test functional aspects of the application.
    Customize the test_scenarios list for your specific needs.
    
    Args:
        url: The URL to test
        output_dir: Directory to save results
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    results = {
        "url": url,
        "tests_run": 0,
        "tests_passed": 0,
        "tests_failed": 0,
        "details": []
    }
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        print(f"⚙️  Running functional tests on: {url}\n")
        
        try:
            page.goto(url, wait_until="networkidle", timeout=30000)
            
            # Test Scenario 1: Check page loads successfully
            test_name = "Page loads successfully"
            print(f"Running: {test_name}")
            try:
                assert page.title(), "Page has a title"
                results["tests_passed"] += 1
                results["details"].append({
                    "test": test_name,
                    "status": "PASS",
                    "message": f"Title: {page.title()}"
                })
                print(f"  ✓ PASS - Title: {page.title()}\n")
            except Exception as e:
                results["tests_failed"] += 1
                results["details"].append({
                    "test": test_name,
                    "status": "FAIL",
                    "error": str(e)
                })
                print(f"  ✗ FAIL - {e}\n")
            results["tests_run"] += 1
            
            # Test Scenario 2: Check navigation links
            test_name = "Navigation links are clickable"
            print(f"Running: {test_name}")
            try:
                links = page.locator("a").all()
                clickable_count = 0
                for link in links[:10]:  # Test first 10 links
                    href = link.get_attribute("href")
                    if href and not href.startswith("#"):
                        clickable_count += 1
                
                assert clickable_count > 0, "At least one navigation link found"
                results["tests_passed"] += 1
                results["details"].append({
                    "test": test_name,
                    "status": "PASS",
                    "message": f"Found {clickable_count} clickable links"
                })
                print(f"  ✓ PASS - Found {clickable_count} clickable links\n")
            except Exception as e:
                results["tests_failed"] += 1
                results["details"].append({
                    "test": test_name,
                    "status": "FAIL",
                    "error": str(e)
                })
                print(f"  ✗ FAIL - {e}\n")
            results["tests_run"] += 1
            
            # Test Scenario 3: Check forms are present and have submit buttons
            test_name = "Forms have submit buttons"
            print(f"Running: {test_name}")
            try:
                forms = page.locator("form").all()
                if len(forms) > 0:
                    forms_with_submit = 0
                    for form in forms:
                        submit_btn = form.locator("button[type='submit'], input[type='submit']")
                        if submit_btn.count() > 0:
                            forms_with_submit += 1
                    
                    assert forms_with_submit > 0, "Forms have submit buttons"
                    results["tests_passed"] += 1
                    results["details"].append({
                        "test": test_name,
                        "status": "PASS",
                        "message": f"{forms_with_submit}/{len(forms)} forms have submit buttons"
                    })
                    print(f"  ✓ PASS - {forms_with_submit}/{len(forms)} forms have submit buttons\n")
                else:
                    results["details"].append({
                        "test": test_name,
                        "status": "SKIP",
                        "message": "No forms found on page"
                    })
                    print(f"  ⊘ SKIP - No forms found\n")
            except Exception as e:
                results["tests_failed"] += 1
                results["details"].append({
                    "test": test_name,
                    "status": "FAIL",
                    "error": str(e)
                })
                print(f"  ✗ FAIL - {e}\n")
            results["tests_run"] += 1
            
            # Test Scenario 4: Check buttons are interactive
            test_name = "Buttons are interactive"
            print(f"Running: {test_name}")
            try:
                buttons = page.locator("button").all()
                if len(buttons) > 0:
                    enabled_count = sum(1 for btn in buttons if btn.is_enabled())
                    assert enabled_count > 0, "At least one button is enabled"
                    results["tests_passed"] += 1
                    results["details"].append({
                        "test": test_name,
                        "status": "PASS",
                        "message": f"{enabled_count}/{len(buttons)} buttons are enabled"
                    })
                    print(f"  ✓ PASS - {enabled_count}/{len(buttons)} buttons enabled\n")
                else:
                    results["details"].append({
                        "test": test_name,
                        "status": "SKIP",
                        "message": "No buttons found on page"
                    })
                    print(f"  ⊘ SKIP - No buttons found\n")
            except Exception as e:
                results["tests_failed"] += 1
                results["details"].append({
                    "test": test_name,
                    "status": "FAIL",
                    "error": str(e)
                })
                print(f"  ✗ FAIL - {e}\n")
            results["tests_run"] += 1
            
            # Test Scenario 5: Check for JavaScript errors
            test_name = "No JavaScript errors"
            print(f"Running: {test_name}")
            js_errors = []
            page.on("pageerror", lambda err: js_errors.append(str(err)))
            page.reload()
            page.wait_for_timeout(2000)
            
            try:
                assert len(js_errors) == 0, f"JavaScript errors detected: {len(js_errors)}"
                results["tests_passed"] += 1
                results["details"].append({
                    "test": test_name,
                    "status": "PASS",
                    "message": "No JavaScript errors detected"
                })
                print(f"  ✓ PASS - No JavaScript errors\n")
            except Exception as e:
                results["tests_failed"] += 1
                results["details"].append({
                    "test": test_name,
                    "status": "FAIL",
                    "error": str(e),
                    "js_errors": js_errors
                })
                print(f"  ✗ FAIL - {len(js_errors)} JavaScript errors found\n")
            results["tests_run"] += 1
            
            # Test Scenario 6: Check responsive behavior
            test_name = "Responsive layout works"
            print(f"Running: {test_name}")
            try:
                # Test mobile viewport
                page.set_viewport_size({"width": 375, "height": 667})
                page.wait_for_timeout(500)
                mobile_screenshot = output_path / "mobile-functional.png"
                page.screenshot(path=str(mobile_screenshot))
                
                # Test desktop viewport
                page.set_viewport_size({"width": 1920, "height": 1080})
                page.wait_for_timeout(500)
                desktop_screenshot = output_path / "desktop-functional.png"
                page.screenshot(path=str(desktop_screenshot))
                
                results["tests_passed"] += 1
                results["details"].append({
                    "test": test_name,
                    "status": "PASS",
                    "message": "Screenshots captured for both viewports"
                })
                print(f"  ✓ PASS - Responsive screenshots captured\n")
            except Exception as e:
                results["tests_failed"] += 1
                results["details"].append({
                    "test": test_name,
                    "status": "FAIL",
                    "error": str(e)
                })
                print(f"  ✗ FAIL - {e}\n")
            results["tests_run"] += 1
            
            # Add your custom test scenarios here:
            # Example:
            # test_name = "Login form works"
            # print(f"Running: {test_name}")
            # try:
            #     page.fill("#username", "testuser")
            #     page.fill("#password", "testpass")
            #     page.click("#login-button")
            #     page.wait_for_selector("#dashboard", timeout=5000)
            #     results["tests_passed"] += 1
            #     print(f"  ✓ PASS\n")
            # except Exception as e:
            #     results["tests_failed"] += 1
            #     print(f"  ✗ FAIL - {e}\n")
            # results["tests_run"] += 1
            
        except Exception as e:
            results["error"] = str(e)
            print(f"❌ Critical error: {e}")
        
        browser.close()
    
    # Calculate success rate
    if results["tests_run"] > 0:
        success_rate = (results["tests_passed"] / results["tests_run"]) * 100
        results["success_rate"] = round(success_rate, 2)
    
    # Save results
    results_file = output_path / "functional-test-report.json"
    with open(results_file, "w") as f:
        json.dump(results, indent=2, fp=f)
    
    # Print summary
    print("=" * 60)
    print("FUNCTIONAL TEST SUMMARY")
    print("=" * 60)
    print(f"Tests Run: {results['tests_run']}")
    print(f"Passed: {results['tests_passed']} ✓")
    print(f"Failed: {results['tests_failed']} ✗")
    if results["tests_run"] > 0:
        print(f"Success Rate: {results.get('success_rate', 0)}%")
    print("=" * 60)
    print(f"\n📄 Detailed report: {results_file}")
    
    return results


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_functionality.py <url> [output_dir]")
        print("Example: python test_functionality.py http://localhost:3000")
        print("\nNote: Customize this script by adding your own test scenarios!")
        sys.exit(1)
    
    url = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "./functional-test-results"
    
    test_functionality(url, output_dir)
