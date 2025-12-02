#!/usr/bin/env python3
"""
Wrapper script to run UI evaluation with proper encoding on Windows
"""
import sys
import os

# Set UTF-8 encoding for stdout/stderr
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# Now import and run the actual evaluation
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.claude', 'skills', 'ui-evaluator', 'scripts'))

from evaluate_ui import evaluate_ui

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "./ui-evaluation-results"

    results = evaluate_ui(url, output_dir)
