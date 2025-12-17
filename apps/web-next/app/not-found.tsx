export default function NotFound() {
  return (
    <html lang="en">
      <body className="flex items-center justify-center min-h-screen bg-surface">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold text-accent">404</h1>
          <p className="text-xl text-slate-400">Page not found</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-accent text-slate-900 rounded-full font-semibold hover:bg-accent/90 transition-colors"
          >
            Go home
          </a>
        </div>
      </body>
    </html>
  );
}
