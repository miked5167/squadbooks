import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

/**
 * Debug endpoint to get your Clerk user ID
 * Visit this after signing in to get your Clerk ID for testing
 */
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated. Please sign in first.' },
        { status: 401 }
      )
    }

    const user = await currentUser()

    return new NextResponse(
      `
<!DOCTYPE html>
<html>
<head>
  <title>Clerk ID - Squadbooks</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: #f9fafb;
    }
    .card {
      background: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    h1 {
      color: #1e3a5f;
      margin-top: 0;
    }
    .clerk-id {
      background: #f3f4f6;
      border: 2px solid #e5e7eb;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
      font-family: 'Courier New', monospace;
      font-size: 16px;
      word-break: break-all;
    }
    .copy-btn {
      background: #1e3a5f;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 600;
    }
    .copy-btn:hover {
      background: #2d5a7b;
    }
    .success {
      color: #059669;
      margin-top: 10px;
      display: none;
    }
    .user-info {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      margin: 20px 0;
    }
    .user-info p {
      margin: 5px 0;
      color: #1e3a5f;
    }
    .instructions {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
    }
    code {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🔑 Your Clerk User ID</h1>

    <div class="user-info">
      <p><strong>Name:</strong> ${user?.firstName || ''} ${user?.lastName || ''}</p>
      <p><strong>Email:</strong> ${user?.emailAddresses[0]?.emailAddress || 'N/A'}</p>
    </div>

    <p>Copy this ID to use in the assistant treasurer setup script:</p>

    <div class="clerk-id" id="clerkId">${userId}</div>

    <button class="copy-btn" onclick="copyToClipboard()">📋 Copy to Clipboard</button>
    <div class="success" id="success">✅ Copied to clipboard!</div>

    <div class="instructions">
      <h3>📝 Next Steps:</h3>
      <ol>
        <li>Copy the Clerk ID above</li>
        <li>Open your terminal</li>
        <li>Run the following command:</li>
      </ol>
      <code style="display: block; margin: 10px 0; padding: 10px;">
        npx tsx scripts/add-assistant-treasurer.ts ${userId} YOUR_EMAIL "Your Name"
      </code>
      <p><strong>Example:</strong></p>
      <code style="display: block; margin: 10px 0; padding: 10px;">
        npx tsx scripts/add-assistant-treasurer.ts ${userId} assistant@example.com "John Smith"
      </code>
    </div>

    <p style="margin-top: 30px;">
      <a href="/dashboard" style="color: #1e3a5f;">← Back to Dashboard</a>
    </p>
  </div>

  <script>
    function copyToClipboard() {
      const text = document.getElementById('clerkId').textContent;
      navigator.clipboard.writeText(text).then(function() {
        const success = document.getElementById('success');
        success.style.display = 'block';
        setTimeout(function() {
          success.style.display = 'none';
        }, 3000);
      });
    }
  </script>
</body>
</html>
      `,
      {
        headers: {
          'Content-Type': 'text/html',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching Clerk user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user information' },
      { status: 500 }
    )
  }
}
