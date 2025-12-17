'use client';

import { motion } from 'framer-motion';
import { Shield, TrendingUp, AlertTriangle, Lock, Eye, CheckCircle, Zap } from 'lucide-react';

export const SEOContentSection = () => {
  return (
    <div className="space-y-16 mt-20">
      {/* Main SEO Content Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto"
      >
        <div className="rounded-3xl border border-white/5 bg-surface/60 p-8 md:p-12">
          {/* Hero Content */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                <Shield className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Why Browser Fingerprinting Matters in 2025
              </h2>
            </div>
            <p className="text-xl text-slate-300 leading-relaxed">
              Look, let me be straight with you. Every time you browse the web, you&apos;re broadcasting a unique
              digital signature that&apos;s more revealing than you think. It&apos;s like walking into a store where
              every employee knows your name, what you bought last time, and what you&apos;re likely to buy next—except
              you never told them any of this.
            </p>
          </div>

          {/* The Numbers Don't Lie */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-7 h-7 text-accent" />
              <h3 className="text-2xl font-bold text-white">The Numbers Don&apos;t Lie</h3>
            </div>

            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              Here&apos;s the thing about browser fingerprinting—it&apos;s not some theoretical privacy concern. It&apos;s
              happening right now, at massive scale. According to{' '}
              <a
                href="https://dl.acm.org/doi/10.1145/3696410.3714548"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline font-medium"
              >
                research presented at the ACM Web Conference 2025
              </a>
              , over <strong className="text-white">10,000 of the world&apos;s top websites</strong> are actively using
              fingerprinting techniques to track you. That&apos;s not a typo. Ten thousand websites.
            </p>

            <div className="grid gap-6 md:grid-cols-2 my-8">
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                <div className="text-4xl font-bold text-red-400 mb-2">99.24%</div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  of users can be <strong>uniquely identified</strong> when combining browser and device fingerprints.
                  Your privacy? Essentially an illusion.
                </p>
                <p className="text-xs text-slate-500 mt-3">
                  Source:{' '}
                  <a
                    href="https://multilogin.com/blog/browser-fingerprinting-the-surveillance-you-can-t-stop/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    Multilogin Browser Fingerprinting Report 2025
                  </a>
                </p>
              </div>

              <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6">
                <div className="text-4xl font-bold text-orange-400 mb-2">80-90%</div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  of browser fingerprints are <strong>unique enough</strong> for accurate tracking across websites and
                  sessions—even without cookies.
                </p>
                <p className="text-xs text-slate-500 mt-3">
                  Source:{' '}
                  <a
                    href="https://engineering.tamu.edu/news/2025/06/websites-are-tracking-you-via-browser-fingerprinting.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    Texas A&M University Research 2025
                  </a>
                </p>
              </div>

              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
                <div className="text-4xl font-bold text-blue-400 mb-2">94%</div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  of browsers tested were <strong>uniquely identifiable</strong> according to the Electronic Frontier
                  Foundation&apos;s Panopticlick project.
                </p>
                <p className="text-xs text-slate-500 mt-3">
                  Source:{' '}
                  <a
                    href="https://pitg.network/news/techdive/2025/08/15/browser-fingerprinting.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    PITG Network Analysis 2025
                  </a>
                </p>
              </div>

              <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6">
                <div className="text-4xl font-bold text-green-400 mb-2">68%</div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  of financial firms reported <strong>lower unauthorized access</strong> after integrating device
                  fingerprinting into fraud detection systems.
                </p>
                <p className="text-xs text-slate-500 mt-3">
                  Source:{' '}
                  <a
                    href="https://guardiandigital.com/content/anti-fingerprint-browsers-and-cybersecurity-risks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    CyberEdge Survey 2024
                  </a>
                </p>
              </div>
            </div>

            <p className="text-lg text-slate-300 leading-relaxed">
              What does this mean for you? Simple. Your browser is a snitch. It tells websites everything: your screen
              resolution, installed fonts, graphics card, timezone, language preferences, installed plugins, and even
              how you move your mouse. Combined together, these data points create a unique signature that follows you
              across the internet like a digital shadow.
            </p>
          </div>

          {/* How Does Browser Fingerprinting Actually Work */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="w-7 h-7 text-accent" />
              <h3 className="text-2xl font-bold text-white">How Does Browser Fingerprinting Actually Work?</h3>
            </div>

            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              Okay, let me break this down in a way that makes sense. Imagine you walk into a room. Someone could
              identify you by looking at your height, weight, hair color, clothing, voice, and the way you walk. Now
              replace &quot;you&quot; with &quot;your browser,&quot; and you&apos;ve got fingerprinting.
            </p>

            <div className="space-y-4 mb-8">
              <div className="rounded-xl border border-white/5 bg-black/20 p-5">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-accent" />
                  Canvas Fingerprinting
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Websites draw invisible graphics on your browser using HTML5 Canvas. Because every computer renders
                  graphics slightly differently (due to hardware, drivers, and OS), the result is unique. It&apos;s
                  like asking everyone to draw the same circle—no two are identical.
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-black/20 p-5">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-accent" />
                  WebGL Fingerprinting
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Similar to Canvas, but uses 3D graphics rendering. Your GPU (graphics card) has specific quirks, and
                  WebGL exposes them. Websites can detect your GPU model, driver version, and rendering capabilities.
                  It&apos;s incredibly difficult to spoof.
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-black/20 p-5">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-accent" />
                  Font Detection
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Every computer has a different set of installed fonts. By testing which fonts are available,
                  websites can narrow down your operating system, software, and even profession. Designers have
                  different fonts than accountants.
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-black/20 p-5">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-accent" />
                  Audio Fingerprinting
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Websites can play silent audio files and analyze how your device processes sound. Different audio
                  stacks (hardware + drivers + OS) produce slightly different outputs. You can&apos;t hear it, but
                  they can detect it.
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-black/20 p-5">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-accent" />
                  Browser Metadata
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  User agent string, screen resolution, timezone, language, plugins, hardware concurrency (CPU cores),
                  battery status, and dozens of other data points exposed through JavaScript. Each one is like a piece
                  of a puzzle that, when combined, reveals your identity.
                </p>
              </div>
            </div>

            <p className="text-lg text-slate-300 leading-relaxed">
              The scary part? All of this happens silently in the background. No pop-ups. No permissions. No consent
              banners. Just JavaScript running on every website you visit, collecting data about your device and
              sending it back to tracking servers.
            </p>
          </div>

          {/* The Google Bombshell */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-7 h-7 text-orange-400" />
              <h3 className="text-2xl font-bold text-white">The Google Bombshell: February 16, 2025</h3>
            </div>

            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6 mb-6">
              <p className="text-lg text-slate-300 leading-relaxed mb-4">
                Here&apos;s something wild that just happened. On December 19, 2024, Google dropped a policy change
                that should have made headlines everywhere. According to{' '}
                <a
                  href="https://www.malwarebytes.com/blog/news/2025/02/google-now-allows-digital-fingerprinting-of-its-users"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline font-medium"
                >
                  Malwarebytes
                </a>
                , Google announced that organizations using its advertising products{' '}
                <strong className="text-white">can now use fingerprinting techniques starting February 16, 2025</strong>
                .
              </p>

              <p className="text-lg text-slate-300 leading-relaxed">
                Previously, Google prohibited its ad customers from fingerprinting users. Now? Fair game. The UK&apos;s
                Information Commissioner&apos;s Office (ICO) sharply criticized this move, but Google isn&apos;t backing
                down. This signals a massive shift in the online advertising industry—fingerprinting is becoming
                mainstream.
              </p>
            </div>

            <p className="text-lg text-slate-300 leading-relaxed">
              What this means for you: More companies will adopt fingerprinting now that Google has given it the green
              light. Cookie banners might disappear, but you&apos;ll be tracked more invasively than ever. The
              difference? You won&apos;t even know it&apos;s happening.
            </p>
          </div>

          {/* Why Traditional Privacy Tools Fall Short */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-7 h-7 text-accent" />
              <h3 className="text-2xl font-bold text-white">Why Traditional Privacy Tools Fall Short</h3>
            </div>

            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              Most people think blocking cookies solves the privacy problem. Wrong. Cookies were just the first
              generation of tracking. Browser fingerprinting is the second generation, and it&apos;s far more
              sophisticated.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-lg font-semibold text-red-300 mb-2">Incognito Mode Myth</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Incognito mode doesn&apos;t hide your fingerprint. It only prevents local history storage. Websites
                    can still identify you through fingerprinting with the same accuracy as normal browsing.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-lg font-semibold text-yellow-300 mb-2">VPN Limitations</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    VPNs hide your IP address but don&apos;t change your browser fingerprint. If you visit the same
                    websites before and after connecting to a VPN, they can still recognize you through fingerprinting.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-lg font-semibold text-orange-300 mb-2">Cookie Blockers Aren&apos;t Enough</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Research from{' '}
                    <a
                      href="https://pitg.network/news/techdive/2025/08/15/browser-fingerprinting.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      PITG Network 2025
                    </a>{' '}
                    confirms that <strong>fingerprinting can bypass GDPR/CCPA opt-outs</strong>, enabling
                    privacy-invasive tracking even when you&apos;ve rejected cookies.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-lg text-slate-300 leading-relaxed">
              The only way to truly protect yourself is to understand your digital fingerprint and actively work to
              reduce its uniqueness. That means using privacy-focused browsers, disabling JavaScript on suspicious
              sites, randomizing browser characteristics, and regularly checking what websites see about you.
            </p>
          </div>

          {/* What You Can Do Right Now */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="w-7 h-7 text-green-400" />
              <h3 className="text-2xl font-bold text-white">What You Can Do Right Now</h3>
            </div>

            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              Look, I&apos;m not going to tell you that privacy is dead and you should give up. That&apos;s defeatist.
              But I am going to tell you the truth: protecting your privacy takes effort. Here&apos;s what actually
              works, based on real security research and testing by our team:
            </p>

            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <div className="rounded-xl border border-white/5 bg-surface/80 p-5">
                <h4 className="text-lg font-semibold text-white mb-3">1. Use IPhey Regularly</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Check your fingerprint every time you change browsers, add extensions, or update your OS. See what
                  changed. Understand what makes you unique. Knowledge is the first step.
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-surface/80 p-5">
                <h4 className="text-lg font-semibold text-white mb-3">2. Switch to Privacy Browsers</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Firefox with privacy extensions, Brave, or Tor Browser. These browsers have built-in fingerprinting
                  resistance. They&apos;re not perfect, but they&apos;re significantly better than Chrome or Safari.
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-surface/80 p-5">
                <h4 className="text-lg font-semibold text-white mb-3">3. Disable JavaScript Selectively</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Most fingerprinting happens through JavaScript. Use NoScript or uBlock Origin to block scripts on
                  websites you don&apos;t trust. Yes, it breaks some sites. That&apos;s the trade-off.
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-surface/80 p-5">
                <h4 className="text-lg font-semibold text-white mb-3">4. Resist Browser Fingerprinting</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Install extensions like Canvas Blocker, WebGL Fingerprint Defender, or Font Fingerprint Defender.
                  They add randomization to make your fingerprint less stable over time.
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-surface/80 p-5">
                <h4 className="text-lg font-semibold text-white mb-3">5. Compartmentalize Your Browsing</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Use different browsers for different activities. One for banking, one for social media, one for
                  shopping. This makes cross-site tracking harder.
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-surface/80 p-5">
                <h4 className="text-lg font-semibold text-white mb-3">6. Update Everything Constantly</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  New browser versions often include improved fingerprinting resistance. Keep your browser, OS, and
                  extensions up to date. Every update slightly changes your fingerprint.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
              <p className="text-slate-300 leading-relaxed">
                <strong className="text-blue-300 text-lg">Bottom line:</strong> Perfect anonymity is impossible unless
                you want to use Tor for everything (which breaks most websites). But you can make yourself significantly
                harder to track. Start with IPhey. See your fingerprint. Understand what makes you unique. Then
                systematically reduce that uniqueness. It&apos;s not sexy, but it works.
              </p>
            </div>
          </div>

          {/* The Future of Online Privacy */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-7 h-7 text-accent" />
              <h3 className="text-2xl font-bold text-white">The Future of Online Privacy</h3>
            </div>

            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              Let&apos;s talk about where this is headed. According to{' '}
              <a
                href="https://www.statista.com/topics/8002/online-privacy-worldwide/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline font-medium"
              >
                Statista&apos;s Online Privacy Report
              </a>
              , <strong className="text-white">36% of surveyed users worldwide</strong> exercised Data Subject Access
              Requests in 2024, up from just 24% in 2022. People are waking up to privacy issues.
            </p>

            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              Meanwhile, companies like Apple and Microsoft are curtailing IP address usage as tracking values. The EU
              is working on the ePrivacy Regulation, which will apply cookie-like rules to fingerprinting. We&apos;re
              seeing a tug-of-war: tech giants want more tracking data, while regulators and privacy advocates push
              back.
            </p>

            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              My prediction? Fingerprinting will get more sophisticated before it gets regulated effectively. The
              technology moves faster than the law. By the time regulations catch up, trackers will have developed new
              techniques. This is an arms race, and it&apos;s not slowing down.
            </p>

            <p className="text-lg text-slate-300 leading-relaxed">
              The good news? Tools like IPhey give you visibility into this invisible tracking. You can&apos;t control
              what you can&apos;t see. So start by seeing what websites see. Then take action. Your privacy is worth
              fighting for, even if it&apos;s an uphill battle.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
