'use client';

import { motion } from 'framer-motion';
import { Book, Shield, Fingerprint, BarChart3, Lock, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { PageLayout } from '@/components/Layout/PageLayout';
import { Section } from '@/components/Layout/Section';

export default function DocsPage() {
  return (
    <PageLayout>
      <div className="space-y-16">
        {/* Hero Section */}
        <Section variant="elevated">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 mb-6">
              <Shield className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need to Know About IPhey
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              Browser fingerprinting, digital privacy, and identity intelligence made simple. Let&apos;s cut through the
              noise.
            </p>
          </motion.div>
        </Section>

        {/* What is IPhey */}
        <Section variant="ghost" icon={Shield} title="What is IPhey Used For?">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="prose prose-lg prose-invert max-w-none"
          >
            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              Look, every time you visit a website, you&apos;re leaving behind a digital fingerprint. It&apos;s like
              your browser is telling websites, &quot;Hey, here&apos;s exactly who I am, what device I&apos;m using,
              where I&apos;m located, and what I&apos;m capable of.&quot; Websites use this information to track you
              across the internet, build profiles about you, and sometimes sell that data to advertisers.
            </p>

            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              IPhey is your personal digital identity inspector. Think of it as a mirror that shows you exactly what
              websites see when you browse. We analyze your browser fingerprint, IP address reputation, geolocation
              data, and device characteristics to give you a complete picture of your online identity. The goal?
              Transparency. You deserve to know what information you&apos;re broadcasting to the internet.
            </p>

            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              Here&apos;s what makes this tool useful: security professionals use it to test proxy setups and detect
              fingerprint leaks. Privacy enthusiasts use it to verify their anonymity tools are actually working.
              Developers use it to understand browser APIs and build better privacy-respecting applications. And
              everyday users? They use it to see how unique and trackable they really are online.
            </p>

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 my-8">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-xl font-semibold text-blue-300 mb-3">The Hard Truth About Online Privacy</h4>
                  <p className="text-slate-300 leading-relaxed mb-3">
                    According to recent research presented at the{' '}
                    <a
                      href="https://dl.acm.org/doi/10.1145/3696410.3714548"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      ACM Web Conference 2025
                    </a>
                    , over <strong>10,000 of the top websites</strong> actively use fingerprinting techniques.
                    That&apos;s not a small number.
                  </p>
                  <p className="text-slate-300 leading-relaxed">
                    Even more concerning: when you combine browser and device fingerprints,{' '}
                    <strong>99.24% of users can be uniquely identified</strong>. Your privacy is essentially an
                    illusion unless you actively take steps to protect it.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </Section>

        {/* Is Browser Fingerprinting Illegal */}
        <Section variant="elevated" icon={AlertCircle} title="Is Browser Fingerprinting Illegal?">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="prose prose-lg prose-invert max-w-none"
          >
            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              Short answer: No, it&apos;s not illegal. But it&apos;s heavily regulated, and there are rules.
            </p>

            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              Browser fingerprinting falls into a legal gray area. Under{' '}
              <a
                href="https://www.eff.org/deeplinks/2018/06/gdpr-and-browser-fingerprinting-how-it-changes-game-sneakiest-web-trackers"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                GDPR (General Data Protection Regulation)
              </a>
              , fingerprinting may constitute processing of personal data. That means companies need either your
              explicit consent or a legitimate legal basis to do it.
            </p>

            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              In California, the{' '}
              <a
                href="https://cheq.ai/blog/what-is-browser-fingerprinting/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                CCPA and CPRA
              </a>{' '}
              are clear: fingerprinting falls under &quot;Cross-Context Behavioral Advertising,&quot; which means
              businesses must let users opt out of data sale or sharing. Organizations that violate GDPR face penalties
              up to €20 million or 4% of annual revenue, whichever is greater.
            </p>

            <h3 className="text-2xl font-semibold text-white mt-10 mb-4">Here&apos;s Where It Gets Interesting</h3>

            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              On December 19, 2024, Google made a significant policy shift. According to{' '}
              <a
                href="https://www.malwarebytes.com/blog/news/2025/02/google-now-allows-digital-fingerprinting-of-its-users"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Malwarebytes
              </a>
              , Google announced that organizations using its advertising products can use fingerprinting techniques
              starting February 16, 2025. This was criticized by the UK&apos;s Information Commissioner&apos;s Office,
              but it signals a broader industry trend.
            </p>

            <div className="grid gap-6 md:grid-cols-2 my-8">
              <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6">
                <CheckCircle className="w-8 h-8 text-green-400 mb-4" />
                <h4 className="text-lg font-semibold text-green-300 mb-3">When It&apos;s Legal</h4>
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li>Security and fraud prevention</li>
                  <li>With explicit user consent</li>
                  <li>Necessary for service delivery</li>
                  <li>Legitimate business interest (GDPR Article 6)</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                <AlertCircle className="w-8 h-8 text-red-400 mb-4" />
                <h4 className="text-lg font-semibold text-red-300 mb-3">When It&apos;s Risky</h4>
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li>Tracking without consent</li>
                  <li>Bypassing cookie opt-outs</li>
                  <li>Cross-site behavioral advertising</li>
                  <li>Selling data without disclosure</li>
                </ul>
              </div>
            </div>

            <p className="text-lg text-slate-300 leading-relaxed">
              The future? The EU is working on the{' '}
              <a
                href="https://legalweb.io/en/news-en/browser-fingerprinting-and-the-gdpr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                ePrivacy Regulation
              </a>
              , which will apply the same rules to fingerprinting that currently govern cookies. Expect stricter
              regulations globally.
            </p>
          </motion.div>
        </Section>

        {/* How Do I Install IPhey */}
        <Section variant="ghost" icon={Download} title="How Do I Install IPhey?">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="prose prose-lg prose-invert max-w-none"
          >
            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              Here&apos;s the best part: <strong>you don&apos;t install anything</strong>.
            </p>

            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              IPhey runs entirely in your browser. No downloads, no extensions, no software. Just visit{' '}
              <code className="text-accent bg-accent/10 px-2 py-1 rounded">iphey.org</code>, and our system
              automatically analyzes your browser fingerprint in real-time. The analysis happens client-side using
              JavaScript, and the results are displayed instantly.
            </p>

            <h3 className="text-2xl font-semibold text-white mt-10 mb-4">Getting Started in 3 Steps</h3>

            <div className="space-y-4 my-8">
              <div className="rounded-2xl border border-white/5 bg-surface/60 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/20 text-accent font-bold flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-white mb-2">Visit the Website</h4>
                    <p className="text-slate-400 leading-relaxed">
                      Open your browser and navigate to <code className="text-accent">iphey.org</code>. Works on
                      Chrome, Firefox, Safari, Edge, and any modern browser.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-surface/60 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/20 text-accent font-bold flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-white mb-2">Let It Scan</h4>
                    <p className="text-slate-400 leading-relaxed">
                      Our system automatically collects your browser fingerprint, IP address, geolocation, and device
                      characteristics. This happens in milliseconds.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-surface/60 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/20 text-accent font-bold flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-white mb-2">Review Your Results</h4>
                    <p className="text-slate-400 leading-relaxed">
                      You&apos;ll see a comprehensive report showing your trust score, fingerprint uniqueness, IP
                      reputation, ASN information, and potential privacy risks. Explore the detailed breakdowns to
                      understand exactly what websites see.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 my-8">
              <p className="text-slate-300 leading-relaxed mb-3">
                <strong className="text-blue-300">Pro Tip:</strong> Test IPhey with different browsers, VPNs, or
                privacy tools to see how your digital fingerprint changes. This is especially useful if you&apos;re
                testing proxy configurations or anti-fingerprinting extensions.
              </p>
            </div>
          </motion.div>
        </Section>

        {/* Is IPhey Free */}
        <Section variant="elevated" icon={CheckCircle} title="Is IPhey Free?">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="prose prose-lg prose-invert max-w-none"
          >
            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              Yes. <strong>Completely free. No hidden fees. No premium tiers.</strong>
            </p>

            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              We built IPhey because we believe digital privacy should be accessible to everyone. You shouldn&apos;t
              need to pay to understand how trackable you are online. Every feature—from basic fingerprint analysis to
              advanced IP intelligence—is available at no cost.
            </p>

            <h3 className="text-2xl font-semibold text-white mt-10 mb-4">What You Get for Free</h3>

            <div className="grid gap-6 md:grid-cols-2 my-8">
              <div className="rounded-2xl border border-white/5 bg-surface/60 p-6">
                <Fingerprint className="w-8 h-8 text-accent mb-4" />
                <h4 className="text-lg font-semibold text-white mb-3">Browser Fingerprinting</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Complete analysis of your browser&apos;s unique characteristics including canvas fingerprinting,
                  WebGL data, fonts, plugins, and hardware metrics.
                </p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-surface/60 p-6">
                <Shield className="w-8 h-8 text-accent mb-4" />
                <h4 className="text-lg font-semibold text-white mb-3">IP Intelligence</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Real-time IP reputation analysis, geolocation detection, ASN information, and threat intelligence
                  from multiple data sources.
                </p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-surface/60 p-6">
                <BarChart3 className="w-8 h-8 text-accent mb-4" />
                <h4 className="text-lg font-semibold text-white mb-3">Trust Score Analysis</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Comprehensive scoring system that evaluates your digital identity across multiple dimensions:
                  browser consistency, location fidelity, and IP reputation.
                </p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-surface/60 p-6">
                <Lock className="w-8 h-8 text-accent mb-4" />
                <h4 className="text-lg font-semibold text-white mb-3">Privacy Toolkit</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Actionable recommendations to improve your privacy and reduce tracking. Learn which fingerprinting
                  vectors are most risky for your setup.
                </p>
              </div>
            </div>

            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              We don&apos;t store your fingerprints. We don&apos;t track you across sessions. We don&apos;t sell your
              data. The analysis happens in your browser, and the results are yours alone. Think of it as a diagnostic
              tool for your digital privacy—free, fast, and transparent.
            </p>
          </motion.div>
        </Section>

        {/* Understanding Your Results */}
        <Section variant="ghost" icon={Book} title="Understanding Your Results">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="prose prose-lg prose-invert max-w-none"
          >
            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              When IPhey analyzes your digital identity, it assigns you a trust score from 0 to 100 and a verdict:
              Trustworthy, Suspicious, or Unreliable. Here&apos;s what that means.
            </p>

            <div className="space-y-4 my-8">
              <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6">
                <h4 className="text-lg font-semibold text-green-400 mb-2">Trustworthy (Score: 70-100)</h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Your browser fingerprint appears consistent, your IP has a clean reputation, and your geolocation
                  matches expected patterns. Websites will likely treat you as a legitimate user.
                </p>
              </div>

              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">
                <h4 className="text-lg font-semibold text-yellow-400 mb-2">Suspicious (Score: 40-69)</h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Something doesn&apos;t add up. Maybe you&apos;re using a proxy, VPN, or privacy-focused browser
                  extensions. Some inconsistencies detected in your fingerprint or IP reputation. Expect occasional
                  CAPTCHAs.
                </p>
              </div>

              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                <h4 className="text-lg font-semibold text-red-400 mb-2">Unreliable (Score: 0-39)</h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  High risk signals detected. Your IP might be flagged for malicious activity, you&apos;re using heavy
                  anonymization tools, or your fingerprint shows signs of spoofing. Websites will be very cautious with
                  your traffic.
                </p>
              </div>
            </div>

            <h3 className="text-2xl font-semibold text-white mt-10 mb-4">Why This Matters</h3>

            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              According to{' '}
              <a
                href="https://engineering.tamu.edu/news/2025/06/websites-are-tracking-you-via-browser-fingerprinting.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Texas A&M University research
              </a>
              , websites are covertly using browser fingerprinting to track users across sessions and sites.
              Understanding your fingerprint helps you make informed decisions about your privacy tools and browsing
              habits.
            </p>

            <p className="text-lg text-slate-300 leading-relaxed">
              The data shows that lower-income users face higher fingerprinting risks, and demographic information like
              age, gender, and race can be inferred from browser attributes. This isn&apos;t just about privacy—it&apos;s
              about fairness and control over your personal information.
            </p>
          </motion.div>
        </Section>

        {/* Data Sources */}
        <Section variant="elevated" icon={BarChart3} title="Our Data Sources">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="prose prose-lg prose-invert max-w-none"
          >
            <p className="text-lg text-slate-300 leading-relaxed mb-6">
              IPhey integrates data from multiple trusted sources to give you the most accurate digital identity
              analysis:
            </p>

            <ul className="space-y-3 text-slate-300 mb-6">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <span>
                  <strong>IPInfo.io:</strong> Primary IP geolocation and ASN data provider
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <span>
                  <strong>Cloudflare Radar:</strong> Real-time threat intelligence and network analysis
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <span>
                  <strong>CreepJS:</strong> Advanced browser fingerprinting detection techniques
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <span>
                  <strong>Custom algorithms:</strong> Proprietary analysis for trust scoring and risk assessment
                </span>
              </li>
            </ul>

            <p className="text-lg text-slate-300 leading-relaxed">
              All sources are referenced in our analysis, and we continuously update our detection methods to keep pace
              with evolving tracking techniques.
            </p>
          </motion.div>
        </Section>
      </div>
    </PageLayout>
  );
}
