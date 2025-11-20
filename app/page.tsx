export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">Squadbooks</h1>
        <p className="text-2xl text-gray-600 mb-8">
          Team Financial Management Platform
        </p>
        <p className="text-lg text-gray-500 max-w-2xl">
          Prevent fraud and build trust with transparent budget tracking for volunteer-run hockey teams.
        </p>
        <div className="mt-12 flex gap-4 justify-center">
          <a
            href="/sign-up"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Get Started
          </a>
          <a
            href="/sign-in"
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Sign In
          </a>
        </div>
        <div className="mt-16 text-sm text-gray-400">
          <p>🏒 Built for Hockey Teams • 🔒 Fraud Prevention • 📊 Budget Transparency</p>
        </div>
      </div>
    </main>
  );
}
