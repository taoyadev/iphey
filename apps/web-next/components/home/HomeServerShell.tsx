import Link from 'next/link';
export function HomeServerShell() {
  return (
    <section className="border-t border-white/10 pt-8">
      <h2 className="text-2xl font-semibold">Understand what you observed</h2>
      <div className="mt-4 flex flex-wrap gap-4">
        {[
          ['/guides', 'Practical guides'],
          ['/fingerprinting/canvas', 'Canvas test'],
          ['/fingerprinting/webgl', 'WebGL test'],
          ['/fingerprinting/audio', 'Audio test'],
          ['/fingerprinting/fonts', 'Font exposure'],
          ['/api-reference', 'API reference'],
        ].map(([href, label]) => (
          <Link key={href} href={href} className="min-h-11 rounded-lg border border-white/10 px-4 py-3 text-accent">
            {label}
          </Link>
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-400">
        These tools describe measurements and differences. They do not measure population uniqueness or certify that a
        connection is safe.
      </p>
    </section>
  );
}
