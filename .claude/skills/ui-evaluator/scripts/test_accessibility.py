#!/usr/bin/env python3
"""
Accessibility Testing Script
Performs detailed WCAG compliance checks and generates actionable reports.
"""

import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright
from axe_playwright_python.sync_playwright import Axe

def test_accessibility(url: str, output_dir: str = "./accessibility-results"):
    """
    Perform comprehensive accessibility testing.
    
    Args:
        url: The URL to test
        output_dir: Directory to save results
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    results = {
        "url": url,
        "violations": [],
        "passes": [],
        "incomplete": [],
        "inapplicable": [],
        "summary": {}
    }
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        print(f"♿ Testing accessibility at: {url}\n")
        
        try:
            page.goto(url, wait_until="networkidle", timeout=30000)
            
            # Run axe accessibility tests
            axe = Axe()
            axe.inject(page)
            axe_results = axe.run(page)
            
            # Process violations by impact level
            violations = axe_results.get("violations", [])
            impact_counts = {"critical": 0, "serious": 0, "moderate": 0, "minor": 0}
            
            for violation in violations:
                impact = violation.get("impact", "unknown")
                if impact in impact_counts:
                    impact_counts[impact] += len(violation.get("nodes", []))
                
                results["violations"].append({
                    "id": violation["id"],
                    "impact": impact,
                    "description": violation["description"],
                    "help": violation["help"],
                    "help_url": violation.get("helpUrl", ""),
                    "tags": violation.get("tags", []),
                    "nodes": [
                        {
                            "html": node.get("html", ""),
                            "target": node.get("target", []),
                            "failure_summary": node.get("failureSummary", "")
                        }
                        for node in violation.get("nodes", [])
                    ]
                })
            
            # Store passes and incomplete for comprehensive reporting
            results["passes"] = [
                {"id": p["id"], "description": p["description"]}
                for p in axe_results.get("passes", [])
            ]
            
            results["incomplete"] = [
                {
                    "id": i["id"],
                    "description": i["description"],
                    "help": i["help"]
                }
                for i in axe_results.get("incomplete", [])
            ]
            
            # Summary statistics
            results["summary"] = {
                "total_violations": len(violations),
                "impact_breakdown": impact_counts,
                "total_passes": len(results["passes"]),
                "incomplete_checks": len(results["incomplete"])
            }
            
            # Print summary
            print("=" * 60)
            print("ACCESSIBILITY TEST RESULTS")
            print("=" * 60)
            print(f"\n🔴 Violations Found: {len(violations)}")
            
            if impact_counts["critical"] > 0:
                print(f"   ⛔ Critical: {impact_counts['critical']}")
            if impact_counts["serious"] > 0:
                print(f"   🔴 Serious: {impact_counts['serious']}")
            if impact_counts["moderate"] > 0:
                print(f"   🟡 Moderate: {impact_counts['moderate']}")
            if impact_counts["minor"] > 0:
                print(f"   ⚪ Minor: {impact_counts['minor']}")
            
            print(f"\n✅ Passed Checks: {len(results['passes'])}")
            
            if results["incomplete"]:
                print(f"⚠️  Incomplete Checks: {len(results['incomplete'])} (require manual review)")
            
            # Show detailed violations
            if violations:
                print("\n" + "=" * 60)
                print("DETAILED VIOLATIONS")
                print("=" * 60)
                
                for v in violations:
                    impact_emoji = {
                        "critical": "⛔",
                        "serious": "🔴",
                        "moderate": "🟡",
                        "minor": "⚪"
                    }
                    emoji = impact_emoji.get(v["impact"], "❓")
                    
                    print(f"\n{emoji} [{v['impact'].upper()}] {v['description']}")
                    print(f"   ID: {v['id']}")
                    print(f"   Help: {v['help']}")
                    print(f"   Learn more: {v.get('helpUrl', 'N/A')}")
                    print(f"   Affected elements: {len(v.get('nodes', []))}")
                    
                    # Show first affected element
                    if v.get("nodes"):
                        first_node = v["nodes"][0]
                        print(f"   Example: {first_node.get('html', '')[:100]}...")
            
            # Recommendations
            print("\n" + "=" * 60)
            print("RECOMMENDATIONS")
            print("=" * 60)
            
            if impact_counts["critical"] > 0 or impact_counts["serious"] > 0:
                print("\n🚨 PRIORITY: Address critical and serious issues immediately")
                print("   These violations significantly impact users with disabilities")
            
            if impact_counts["moderate"] > 0:
                print("\n⚠️  IMPORTANT: Fix moderate issues in the next sprint")
                print("   These issues create barriers for some users")
            
            if len(violations) == 0:
                print("\n🎉 Great job! No automated accessibility violations detected.")
                print("   Remember: Automated tests catch ~30-40% of issues.")
                print("   Consider manual testing with screen readers and keyboard navigation.")
            
        except Exception as e:
            results["error"] = str(e)
            print(f"❌ Error during testing: {e}")
        
        browser.close()
    
    # Save detailed results
    results_file = output_path / "accessibility-report.json"
    with open(results_file, "w") as f:
        json.dump(results, indent=2, fp=f)
    
    print(f"\n📄 Detailed report saved: {results_file}")
    
    return results


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_accessibility.py <url> [output_dir]")
        print("Example: python test_accessibility.py http://localhost:3000")
        sys.exit(1)
    
    url = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "./accessibility-results"
    
    test_accessibility(url, output_dir)
