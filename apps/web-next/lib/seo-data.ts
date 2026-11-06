import type { FaqItem } from '@/lib/seo';

export interface RelatedRoute {
  href: string;
  label: string;
  description: string;
}

export interface FingerprintingTopic {
  slug: string;
  title: string;
  description: string;
  intro: string;
  principles: string[];
  risks: string[];
  misconceptions: string[];
  testingSteps: string[];
  faq: FaqItem[];
  related: RelatedRoute[];
}

export interface ComparisonPage {
  slug: string;
  title: string;
  description: string;
  summary: string;
  differentiators: string[];
  bestFor: string[];
  matrix: Array<{
    feature: string;
    iphey: string;
    competitor: string;
  }>;
  faq: FaqItem[];
  related: RelatedRoute[];
}

export interface AsnSeedEntry {
  asn: number;
  name: string;
  orgName: string;
  country: string;
  description: string;
  networkType: string;
  sampleIps: string[];
  related: RelatedRoute[];
}

export interface IpSeedFallback {
  ip: string;
  city: string;
  region: string;
  country: string;
  timezone: string;
  org: string;
  asn: number;
  networkType: string;
  riskScore: number;
  riskFactors: string[];
}

// Mirrors worker seed intent so static IP pages align with warmed/frequently queried addresses.
export const COMMON_IP_SEEDS = [
  '8.8.8.8',
  '8.8.4.4',
  '1.1.1.1',
  '1.0.0.1',
  '9.9.9.9',
  '208.67.222.222',
  '208.67.220.220',
  '13.107.42.14',
  '52.85.0.1',
  '104.16.0.1',
  '185.220.101.1',
] as const;

export const HIGH_VALUE_IP_SEEDS = [
  '76.76.21.21',
  '151.101.1.69',
  '34.117.59.81',
  '45.33.32.156',
  '172.67.74.227',
  '23.235.33.143',
  '104.244.42.129',
  '66.249.66.1',
  '185.220.101.10',
] as const;

export const SEO_IP_SEEDS = Array.from(new Set([...COMMON_IP_SEEDS, ...HIGH_VALUE_IP_SEEDS]));

export const ASN_SEED_REGISTRY: AsnSeedEntry[] = [
  {
    asn: 13335,
    name: 'Cloudflare',
    orgName: 'Cloudflare, Inc.',
    country: 'US',
    description: 'Anycast edge and security network commonly associated with DNS, CDN, and reverse-proxy traffic.',
    networkType: 'anycast edge',
    sampleIps: ['1.1.1.1', '1.0.0.1', '104.16.0.1', '172.67.74.227'],
    related: [
      {
        href: '/fingerprinting/webrtc',
        label: 'WebRTC leak testing',
        description: 'Compare network leaks against edge IP paths.',
      },
      {
        href: '/vs/browserleaks',
        label: 'IPhey vs BrowserLeaks',
        description: 'See how IPhey adds IP and ASN context to fingerprint checks.',
      },
    ],
  },
  {
    asn: 15169,
    name: 'Google',
    orgName: 'Google LLC',
    country: 'US',
    description: 'Global backbone for Google services, public DNS, and cloud-hosted traffic.',
    networkType: 'hyperscale backbone',
    sampleIps: ['8.8.8.8', '8.8.4.4', '34.117.59.81', '66.249.66.1'],
    related: [
      {
        href: '/guides/how-ip-reputation-affects-risk-detection',
        label: 'IP reputation guide',
        description: 'Learn why provider reputation changes trust decisions.',
      },
      {
        href: '/fingerprinting/canvas',
        label: 'Canvas fingerprinting',
        description: 'Understand how browser signals combine with network identity.',
      },
    ],
  },
  {
    asn: 16509,
    name: 'Amazon',
    orgName: 'Amazon.com, Inc.',
    country: 'US',
    description: 'AWS and edge-hosted service traffic commonly seen in cloud workloads and automation infrastructure.',
    networkType: 'cloud hosting',
    sampleIps: ['52.85.0.1'],
    related: [
      {
        href: '/vs/cover-your-tracks',
        label: 'IPhey vs Cover Your Tracks',
        description: 'See how IP + ASN context changes browser uniqueness analysis.',
      },
      {
        href: '/guides/how-iphey-scores-digital-identity',
        label: 'Scoring methodology',
        description: 'Break down how IPhey weighs fingerprint and network signals.',
      },
    ],
  },
  {
    asn: 8075,
    name: 'Microsoft',
    orgName: 'Microsoft Corporation',
    country: 'US',
    description: 'Azure and Microsoft service network seen in enterprise and consumer traffic patterns.',
    networkType: 'cloud hosting',
    sampleIps: ['13.107.42.14'],
    related: [
      {
        href: '/fingerprinting/webgl',
        label: 'WebGL fingerprinting',
        description: 'GPU and browser consistency checks matter more on cloud setups.',
      },
      {
        href: '/guides/browser-fingerprinting-explained',
        label: 'Fingerprinting explained',
        description: 'Map browser signals to provider-level identity hints.',
      },
    ],
  },
  {
    asn: 14061,
    name: 'DigitalOcean',
    orgName: 'DigitalOcean, LLC',
    country: 'US',
    description: 'Developer-centric infrastructure network often used for application hosting and test environments.',
    networkType: 'cloud hosting',
    sampleIps: ['104.244.42.129'],
    related: [
      {
        href: '/guides/proxy-vs-vpn-vs-tor-for-fingerprint-privacy',
        label: 'Proxy vs VPN vs Tor',
        description: 'Understand how hosted networks differ from privacy exits.',
      },
      {
        href: '/fingerprinting/audio',
        label: 'Audio fingerprinting',
        description: 'Cross-check browser uniqueness against cloud network context.',
      },
    ],
  },
  {
    asn: 24940,
    name: 'Hetzner',
    orgName: 'Hetzner Online GmbH',
    country: 'DE',
    description: 'European hosting network frequently appearing in server, bot, and VPN-adjacent traffic.',
    networkType: 'hosting provider',
    sampleIps: ['45.33.32.156'],
    related: [
      {
        href: '/guides/how-to-test-vpn-leaks',
        label: 'How to test VPN leaks',
        description: 'Use live checks to separate privacy gains from reputation costs.',
      },
      {
        href: '/vs/whoer',
        label: 'IPhey vs WHOER',
        description: 'Compare hosted-IP visibility in two different privacy toolkits.',
      },
    ],
  },
];

export const ASN_SEEDS = ASN_SEED_REGISTRY.map(entry => entry.asn);

export const IP_SEED_FALLBACKS: Record<string, IpSeedFallback> = {
  '8.8.8.8': {
    ip: '8.8.8.8',
    city: 'Anycast',
    region: 'Global',
    country: 'US',
    timezone: 'UTC',
    org: 'Google Public DNS',
    asn: 15169,
    networkType: 'public dns backbone',
    riskScore: 8,
    riskFactors: ['Public DNS anycast route', 'Frequently reused in test traffic'],
  },
  '8.8.4.4': {
    ip: '8.8.4.4',
    city: 'Anycast',
    region: 'Global',
    country: 'US',
    timezone: 'UTC',
    org: 'Google Public DNS',
    asn: 15169,
    networkType: 'public dns backbone',
    riskScore: 8,
    riskFactors: ['Public DNS anycast route', 'Frequently reused in test traffic'],
  },
  '1.1.1.1': {
    ip: '1.1.1.1',
    city: 'Anycast',
    region: 'Global',
    country: 'US',
    timezone: 'UTC',
    org: 'Cloudflare DNS',
    asn: 13335,
    networkType: 'anycast edge',
    riskScore: 6,
    riskFactors: ['Public resolver anycast route'],
  },
  '1.0.0.1': {
    ip: '1.0.0.1',
    city: 'Anycast',
    region: 'Global',
    country: 'US',
    timezone: 'UTC',
    org: 'Cloudflare DNS',
    asn: 13335,
    networkType: 'anycast edge',
    riskScore: 6,
    riskFactors: ['Public resolver anycast route'],
  },
  '9.9.9.9': {
    ip: '9.9.9.9',
    city: 'Anycast',
    region: 'Global',
    country: 'US',
    timezone: 'UTC',
    org: 'Quad9 DNS',
    asn: 19281,
    networkType: 'public dns backbone',
    riskScore: 7,
    riskFactors: ['Public resolver anycast route'],
  },
  '208.67.222.222': {
    ip: '208.67.222.222',
    city: 'Anycast',
    region: 'Global',
    country: 'US',
    timezone: 'UTC',
    org: 'Cisco OpenDNS',
    asn: 36692,
    networkType: 'public dns backbone',
    riskScore: 7,
    riskFactors: ['Public resolver traffic'],
  },
  '208.67.220.220': {
    ip: '208.67.220.220',
    city: 'Anycast',
    region: 'Global',
    country: 'US',
    timezone: 'UTC',
    org: 'Cisco OpenDNS',
    asn: 36692,
    networkType: 'public dns backbone',
    riskScore: 7,
    riskFactors: ['Public resolver traffic'],
  },
  '13.107.42.14': {
    ip: '13.107.42.14',
    city: 'Redmond',
    region: 'Washington',
    country: 'US',
    timezone: 'America/Los_Angeles',
    org: 'Microsoft Corporation',
    asn: 8075,
    networkType: 'cloud hosting',
    riskScore: 18,
    riskFactors: ['Large cloud service edge'],
  },
  '52.85.0.1': {
    ip: '52.85.0.1',
    city: 'Seattle',
    region: 'Washington',
    country: 'US',
    timezone: 'America/Los_Angeles',
    org: 'Amazon CloudFront',
    asn: 16509,
    networkType: 'cdn edge',
    riskScore: 20,
    riskFactors: ['Content delivery edge', 'Common in hosted traffic'],
  },
  '104.16.0.1': {
    ip: '104.16.0.1',
    city: 'Anycast',
    region: 'Global',
    country: 'US',
    timezone: 'UTC',
    org: 'Cloudflare, Inc.',
    asn: 13335,
    networkType: 'anycast edge',
    riskScore: 12,
    riskFactors: ['Reverse proxy / CDN edge'],
  },
  '185.220.101.1': {
    ip: '185.220.101.1',
    city: 'Unknown',
    region: 'Unknown',
    country: 'DE',
    timezone: 'Europe/Berlin',
    org: 'Tor Exit',
    asn: 60729,
    networkType: 'tor exit',
    riskScore: 82,
    riskFactors: ['Known Tor exit node', 'High anonymity / high recognizability'],
  },
  '185.220.101.10': {
    ip: '185.220.101.10',
    city: 'Unknown',
    region: 'Unknown',
    country: 'DE',
    timezone: 'Europe/Berlin',
    org: 'Tor Exit',
    asn: 60729,
    networkType: 'tor exit',
    riskScore: 82,
    riskFactors: ['Known Tor exit node', 'High anonymity / high recognizability'],
  },
  '76.76.21.21': {
    ip: '76.76.21.21',
    city: 'San Francisco',
    region: 'California',
    country: 'US',
    timezone: 'America/Los_Angeles',
    org: 'Vercel, Inc.',
    asn: 396982,
    networkType: 'edge hosting',
    riskScore: 24,
    riskFactors: ['Hosted edge route', 'Common in preview and automation traffic'],
  },
  '151.101.1.69': {
    ip: '151.101.1.69',
    city: 'Anycast',
    region: 'Global',
    country: 'US',
    timezone: 'UTC',
    org: 'Fastly, Inc.',
    asn: 54113,
    networkType: 'cdn edge',
    riskScore: 18,
    riskFactors: ['CDN edge route'],
  },
  '34.117.59.81': {
    ip: '34.117.59.81',
    city: 'Kansas City',
    region: 'Missouri',
    country: 'US',
    timezone: 'America/Chicago',
    org: 'Google Cloud',
    asn: 15169,
    networkType: 'cloud hosting',
    riskScore: 20,
    riskFactors: ['Cloud-hosted edge route'],
  },
  '45.33.32.156': {
    ip: '45.33.32.156',
    city: 'Fremont',
    region: 'California',
    country: 'US',
    timezone: 'America/Los_Angeles',
    org: 'Akamai Connected Cloud',
    asn: 63949,
    networkType: 'cloud hosting',
    riskScore: 26,
    riskFactors: ['Hosted infrastructure route'],
  },
  '172.67.74.227': {
    ip: '172.67.74.227',
    city: 'Anycast',
    region: 'Global',
    country: 'US',
    timezone: 'UTC',
    org: 'Cloudflare, Inc.',
    asn: 13335,
    networkType: 'reverse proxy edge',
    riskScore: 16,
    riskFactors: ['Proxy edge route'],
  },
  '23.235.33.143': {
    ip: '23.235.33.143',
    city: 'Anycast',
    region: 'Global',
    country: 'US',
    timezone: 'UTC',
    org: 'Fastly, Inc.',
    asn: 54113,
    networkType: 'cdn edge',
    riskScore: 18,
    riskFactors: ['CDN edge route'],
  },
  '104.244.42.129': {
    ip: '104.244.42.129',
    city: 'San Francisco',
    region: 'California',
    country: 'US',
    timezone: 'America/Los_Angeles',
    org: 'X Corp.',
    asn: 13414,
    networkType: 'consumer web platform',
    riskScore: 12,
    riskFactors: ['High-volume consumer service route'],
  },
  '66.249.66.1': {
    ip: '66.249.66.1',
    city: 'Mountain View',
    region: 'California',
    country: 'US',
    timezone: 'America/Los_Angeles',
    org: 'Googlebot',
    asn: 15169,
    networkType: 'crawler infrastructure',
    riskScore: 32,
    riskFactors: ['Known crawler range', 'Automation context likely'],
  },
};

export const FINGERPRINTING_TOPICS: FingerprintingTopic[] = [
  {
    slug: 'canvas',
    title: 'Canvas fingerprinting test',
    description: 'Learn how canvas hashes make browsers identifiable and how to test whether your setup stands out.',
    intro:
      'Canvas fingerprinting renders the same drawing on your browser and measures subtle differences in how graphics stack, fonts, and GPU paths behave.',
    principles: [
      'The browser renders hidden text and vector shapes into a canvas element.',
      'Hash differences are driven by GPU, OS, font stack, anti-aliasing, and driver behavior.',
      'A stable canvas hash becomes more powerful when paired with IP reputation and timezone consistency.',
    ],
    risks: [
      'Extension-based noise can block the read but also create a rare pattern.',
      'Cloud browsers and VMs often expose repeatable graphics quirks.',
      'Cross-site trackers use canvas alongside cookies, IP, and local signals.',
    ],
    misconceptions: [
      'Blocking canvas entirely does not automatically make you blend in.',
      'A VPN does not change the canvas hash your browser emits.',
    ],
    testingSteps: [
      'Run the main IPhey inspector and compare your uniqueness score before and after privacy changes.',
      'Check whether hardware and browser panels create the biggest entropy lift.',
      'Inspect the related IP/ASN page to see whether network reputation compounds the signal.',
    ],
    faq: [
      {
        question: 'Does private browsing stop canvas fingerprinting?',
        answer:
          'Not by itself. Incognito mode usually resets cookies, but canvas rendering behavior often remains similar.',
      },
      {
        question: 'Is noisy canvas output always better?',
        answer: 'Only if it matches a common crowd. Rare noise patterns can make you more distinctive.',
      },
    ],
    related: [
      {
        href: '/guides/browser-fingerprinting-explained',
        label: 'Fingerprinting explained',
        description: 'Start with the full signal map before tuning single techniques.',
      },
      {
        href: '/vs/browserleaks',
        label: 'IPhey vs BrowserLeaks',
        description: 'Compare a canvas-only view with a fuller identity model.',
      },
    ],
  },
  {
    slug: 'webgl',
    title: 'WebGL fingerprinting test',
    description: 'Understand how GPU renderers, vendor strings, and graphics capabilities affect browser uniqueness.',
    intro:
      'WebGL exposes GPU-level hints such as renderer strings, extension support, and texture limits that can be surprisingly distinctive.',
    principles: [
      'WebGL fingerprints rely on GPU vendor, driver quirks, and renderer outputs.',
      'Virtualized environments frequently expose atypical renderer combinations.',
      'Browser spoofing can fail when User-Agent and WebGL values disagree.',
    ],
    risks: [
      'Remote desktops and cloud browsers often leak unusual GPU combinations.',
      'Driver mismatches can make an otherwise normal browser look synthetic.',
      'Render-blocking extensions can become a fingerprint of their own.',
    ],
    misconceptions: [
      'Changing the User-Agent does not rewrite your GPU renderer.',
      'Disabling WebGL can trip trust checks on sites that expect modern browser support.',
    ],
    testingSteps: [
      'Review the hardware panel for renderer consistency.',
      'Cross-check the browser panel for OS or User-Agent mismatches.',
      'Compare live results with a second browser profile to isolate the GPU contribution.',
    ],
    faq: [
      {
        question: 'Why do anti-detect browsers care about WebGL?',
        answer: 'Because GPU-level inconsistencies are hard to spoof consistently at scale.',
      },
      {
        question: 'Can a laptop lid or external monitor change WebGL output?',
        answer: 'Sometimes. Driver paths, scaling, and GPU switching can affect related signals.',
      },
    ],
    related: [
      {
        href: '/guides/how-to-reduce-browser-uniqueness',
        label: 'Reduce browser uniqueness',
        description: 'Learn which changes lower uniqueness without breaking consistency.',
      },
      {
        href: '/ip/1.1.1.1',
        label: 'Edge IP example',
        description: 'See how network identity complements WebGL signals.',
      },
    ],
  },
  {
    slug: 'audio',
    title: 'Audio fingerprinting test',
    description:
      'See how the Web Audio API contributes to fingerprint uniqueness and what stable audio paths look like.',
    intro:
      'Audio fingerprinting measures tiny output differences in oscillators and compressors that depend on hardware, drivers, and browser implementations.',
    principles: [
      'Web Audio nodes produce slightly different floating-point results across devices.',
      'Privacy tools may block or normalize audio APIs, but that choice itself can be visible.',
      'Audio entropy often matters more when combined with canvas and font results.',
    ],
    risks: [
      'Headless and heavily sandboxed browsers often expose brittle audio behavior.',
      'Inconsistent output between profiles can raise confidence in automation detection.',
    ],
    misconceptions: [
      'Muting your speakers does not change the audio fingerprint.',
      'Audio entropy is not only about microphones or media permissions.',
    ],
    testingSteps: [
      'Run a live report, then compare results with extensions enabled and disabled.',
      'Watch whether the software panel also changes when audio APIs are blocked.',
      'Use the methodology guide to interpret entropy shifts rather than raw blocks alone.',
    ],
    faq: [
      {
        question: 'Does audio fingerprinting require user permission?',
        answer: 'Not for the common passive checks based on audio processing APIs.',
      },
      {
        question: 'Can Bluetooth devices influence the result?',
        answer: 'Sometimes, especially if they switch the audio stack or output path.',
      },
    ],
    related: [
      {
        href: '/guides/how-iphey-scores-digital-identity',
        label: 'Scoring methodology',
        description: 'See how audio entropy is normalized into uniqueness bands.',
      },
      {
        href: '/vs/whoer',
        label: 'IPhey vs WHOER',
        description: 'Compare signal depth on browser-level fingerprints.',
      },
    ],
  },
  {
    slug: 'fonts',
    title: 'Font fingerprinting test',
    description: 'Explore how installed fonts and rendering stacks create a high-entropy browser fingerprint.',
    intro:
      'Font fingerprints estimate which typefaces are installed and how text renders, revealing operating system history, bundled apps, and profile customizations.',
    principles: [
      'Installed fonts act as a compact inventory of your browser and OS environment.',
      'Enterprise software, design tools, and language packs all change the result.',
      'Even when font lists are hidden, fallback behaviors can remain distinctive.',
    ],
    risks: [
      'Minimal sandboxed browsers can look rare because they expose too few fonts.',
      'Internationalization packs can make locale claims more believable or more unusual, depending on the rest of the profile.',
    ],
    misconceptions: [
      'More fonts are not always worse; uncommon combinations matter more than raw counts.',
      'Tor-style font reduction works because many users share the same reduced set.',
    ],
    testingSteps: [
      'Compare a standard browser profile and a hardened privacy profile side by side.',
      'Watch how the hardware and browser panels shift when font entropy changes.',
      'Use related guide content to decide whether lower uniqueness also preserves site compatibility.',
    ],
    faq: [
      {
        question: 'Do websites see every font file on my computer?',
        answer: 'Usually no, but they can infer availability for many common font names.',
      },
      {
        question: 'Can language packs change font uniqueness?',
        answer: 'Yes. Additional scripts and fallback fonts often influence detectability.',
      },
    ],
    related: [
      {
        href: '/guides/proxy-vs-vpn-vs-tor-for-fingerprint-privacy',
        label: 'Proxy vs VPN vs Tor',
        description: 'Network privacy tools do not directly solve font uniqueness.',
      },
      {
        href: '/ip/8.8.8.8',
        label: 'Google DNS IP page',
        description: 'Cross-check a well-known network baseline against browser-level entropy.',
      },
    ],
  },
  {
    slug: 'webrtc',
    title: 'WebRTC leak and fingerprint test',
    description: 'Test whether WebRTC behavior exposes local IP hints or creates a rare software profile.',
    intro:
      'WebRTC is useful for real-time communication, but it can also reveal local routing details and expose a privacy profile when aggressively blocked.',
    principles: [
      'STUN negotiation can reveal additional IP hints and network paths.',
      'Many anti-fingerprint setups disable or modify WebRTC, which affects the software panel.',
      'WebRTC behavior should be evaluated alongside IP, ASN, and geolocation consistency.',
    ],
    risks: [
      'Misconfigured VPNs can still expose local or regional routing hints.',
      'Hard blocking WebRTC can make a browser look less common in mainstream traffic.',
    ],
    misconceptions: [
      'A VPN does not guarantee WebRTC leak protection.',
      'Disabling WebRTC is not always the best choice if your goal is to blend in.',
    ],
    testingSteps: [
      'Run the main inspector with and without your VPN enabled.',
      'Check whether the IP intelligence tab and software panel both change.',
      'Read the VPN leak guide for a repeatable before/after workflow.',
    ],
    faq: [
      {
        question: 'Can WebRTC reveal my home IP?',
        answer: 'It can in some configurations, especially if VPN or browser settings are incomplete.',
      },
      {
        question: 'Should I disable WebRTC completely?',
        answer:
          'Only if that fits your threat model. For many users, a consistent normal profile is better than a rare broken one.',
      },
    ],
    related: [
      {
        href: '/guides/how-to-test-vpn-leaks',
        label: 'How to test VPN leaks',
        description: 'Use a repeatable workflow instead of one-off checks.',
      },
      {
        href: '/asn/13335',
        label: 'Cloudflare ASN page',
        description: 'Inspect how edge-network routing and WebRTC leaks can intersect.',
      },
    ],
  },
];

export const COMPARISON_PAGES: ComparisonPage[] = [
  {
    slug: 'browserleaks',
    title: 'IPhey vs BrowserLeaks',
    description:
      'Compare a raw browser fingerprint lab with a workflow that also explains IP, ASN, and trust implications.',
    summary:
      'BrowserLeaks is excellent for enumerating browser-exposed values. IPhey adds guided interpretation, IP/ASN intelligence, and a single uniqueness model that ties browser and network together.',
    differentiators: [
      'Unified uniqueness summary instead of isolated technical readouts.',
      'ASN, IP reputation, and geolocation consistency alongside browser fingerprints.',
      'Action-oriented explanations for why a signal matters operationally.',
    ],
    bestFor: [
      'QA analysts validating profile changes',
      'Privacy users checking if network and browser stories line up',
      'Fraud teams who need browser plus network context',
    ],
    matrix: [
      {
        feature: 'Canvas/WebGL/Audio checks',
        iphey: 'Yes, plus explanation and entropy',
        competitor: 'Yes, mostly raw values',
      },
      { feature: 'IP + ASN context', iphey: 'Built in', competitor: 'Limited' },
      { feature: 'Uniqueness summary', iphey: 'Single band and narrative', competitor: 'Mostly manual interpretation' },
      { feature: 'Operational trust framing', iphey: 'Browser + network consistency', competitor: 'Browser-centric' },
    ],
    faq: [
      {
        question: 'Is BrowserLeaks still useful?',
        answer:
          'Yes. It is a strong lab surface for raw exposure. IPhey is better when you need a guided decision surface.',
      },
      {
        question: 'Why compare ASN context here?',
        answer:
          'Because two identical browser fingerprints can behave very differently when one arrives from a mainstream ISP and the other from a suspicious hosting ASN.',
      },
    ],
    related: [
      {
        href: '/guides/how-iphey-scores-digital-identity',
        label: 'Methodology guide',
        description: 'See how IPhey turns raw signals into one uniqueness story.',
      },
      {
        href: '/fingerprinting/canvas',
        label: 'Canvas topic page',
        description: 'Inspect one of the signature techniques in more detail.',
      },
    ],
  },
  {
    slug: 'whoer',
    title: 'IPhey vs WHOER',
    description:
      'Understand the difference between a privacy scorecard and a combined fingerprint plus network analysis workflow.',
    summary:
      'WHOER is geared toward quick privacy hygiene checks. IPhey goes deeper on why a setup stands out, which signals are responsible, and how network provenance changes the conclusion.',
    differentiators: [
      'Detailed signal breakdowns per panel rather than one blended privacy grade.',
      'More explicit emphasis on fingerprint uniqueness and entropy.',
      'Clearer IP/ASN linkage for hosted, VPN, and edge-network traffic.',
    ],
    bestFor: [
      'Users optimizing privacy without losing realism',
      'Teams comparing multiple browsers or proxies',
      'Researchers looking for repeatable remediation steps',
    ],
    matrix: [
      { feature: 'Privacy score', iphey: 'Trust + uniqueness views', competitor: 'Single privacy score' },
      { feature: 'Fingerprint education', iphey: 'Topic pages and guides', competitor: 'Basic summaries' },
      { feature: 'ASN/network analysis', iphey: 'Integrated', competitor: 'Minimal' },
      { feature: 'Remediation workflow', iphey: 'Panel-level recommendations', competitor: 'General advice' },
    ],
    faq: [
      {
        question: 'Which is better for casual users?',
        answer: 'WHOER is lighter. IPhey is better when you want to understand the why behind the result.',
      },
      {
        question: 'Does IPhey replace VPN testing?',
        answer: 'It complements it by showing whether the browser and network now tell a coherent story.',
      },
    ],
    related: [
      {
        href: '/guides/how-to-test-vpn-leaks',
        label: 'VPN leak guide',
        description: 'Turn one-off checks into a consistent validation workflow.',
      },
      {
        href: '/fingerprinting/webrtc',
        label: 'WebRTC topic',
        description: 'A common failure point in VPN and proxy setups.',
      },
    ],
  },
  {
    slug: 'cover-your-tracks',
    title: 'IPhey vs Cover Your Tracks',
    description:
      'Compare browser uniqueness testing alone versus a model that also evaluates IP, ASN, and geographic consistency.',
    summary:
      'Cover Your Tracks is the reference point for browser uniqueness. IPhey keeps that idea but extends it: not just how unique your browser looks, but how your browser, IP, ASN, and geography look together.',
    differentiators: [
      'Not just browser uniqueness: IP, ASN, geolocation, and network type join the analysis.',
      'Panel-level explanations make it easier to decide which privacy changes are helping or hurting.',
      'Built for before/after testing across VPNs, browsers, and hosted environments.',
    ],
    bestFor: [
      'Users comparing anti-fingerprint profiles',
      'Fraud and QA teams testing realism',
      'Anyone who needs browser uniqueness plus network provenance',
    ],
    matrix: [
      { feature: 'Browser uniqueness', iphey: 'Yes', competitor: 'Yes' },
      { feature: 'IP / ASN / network signals', iphey: 'Yes', competitor: 'No' },
      { feature: 'Guided remediation', iphey: 'Panel-specific', competitor: 'Limited' },
      { feature: 'Identity coherence model', iphey: 'Browser + network together', competitor: 'Browser only' },
    ],
    faq: [
      {
        question: 'Why add IP and ASN to uniqueness?',
        answer: 'Because websites often weigh the whole digital identity, not just a browser hash.',
      },
      {
        question: 'Can I still use Cover Your Tracks?',
        answer: 'Yes. It remains useful for pure browser uniqueness checks; IPhey is broader.',
      },
    ],
    related: [
      {
        href: '/guides/how-to-reduce-browser-uniqueness',
        label: 'Reduce uniqueness guide',
        description: 'Lower uniqueness without creating a stranger overall profile.',
      },
      {
        href: '/asn/16509',
        label: 'Amazon ASN example',
        description: 'See why hosted network context changes how uniqueness is interpreted.',
      },
    ],
  },
];
