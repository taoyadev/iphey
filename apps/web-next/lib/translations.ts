// Temporary translation replacement (English only)
// This replaces next-intl's useTranslations

const translations: Record<string, any> = {
  common: {
    actions: {
      rerun: 'Re-run Analysis',
      tryAgain: 'Try Again',
      openExtended: 'Open Extended Tools',
      settings: 'Settings',
    },
  },
  interactiveRadar: {
    analyzingFingerprint: 'Analyzing fingerprint...',
    panels: {
      browser: 'Browser',
      location: 'Location',
      ipAddress: 'IP Address',
      hardware: 'Hardware',
      software: 'Software',
    },
    status: {
      trustworthy: 'Trustworthy',
      suspicious: 'Suspicious',
      unreliable: 'Unreliable',
    },
    keyInsights: 'Key Insights',
    multipleConflicts: 'Multiple conflicts detected across identity signals. Review each panel for details.',
    inconsistenciesFound: 'Some inconsistencies found in your digital fingerprint. Check flagged panels.',
    strongConsistency: 'Your identity signals show strong consistency across all panels.',
    clickPanel: 'Click any panel above for detailed analysis.',
  },
  aiChat: {
    title: 'IPH Assistant',
    bubbleText: 'Analyze your fingerprint?',
    bubbleCta: 'Ask IPH',
    placeholder: 'Ask about your fingerprint...',
    thinking: 'Thinking...',
    rateLimited: 'Please wait a moment before sending another message. Rate limit: 5 messages per minute.',
    error: 'Unable to get a response right now. Please try again later.',
    toggleAriaLabel: 'Open AI assistant',
    closeAriaLabel: 'Close assistant',
    sendAriaLabel: 'Send message',
    welcome: "Hi! I'm IPH, your fingerprint analysis assistant. I can help you understand your browser fingerprint, explain your trust scores, and provide privacy recommendations. What would you like to know?",
    quickQuestions: {
      score: 'Why is my trust score low?',
      privacy: 'How can I improve my privacy?',
      fingerprint: 'What is browser fingerprinting?',
      vpn: 'Is my VPN working correctly?',
      hardware: 'Explain my hardware score',
    },
  },
  home: {
    'verdict.title': 'Your Digital Identity',
    'verdict.trustworthy': 'Your identity appears trustworthy',
    'verdict.suspicious': 'Some suspicious patterns detected',
    'verdict.unreliable': 'High-risk identity signals detected',
    'error.loadFailed': 'Failed to Load Report',
    'error.unknown': 'An unknown error occurred',
    'sections.overview': 'Overview',
    'sections.analysis': 'Analysis',
    'sections.telemetry': 'Telemetry',
    'sections.features': 'Features',
    'insights.ipAddress': 'IP Address',
    'insights.detecting': 'Detecting...',
    'insights.fetched': 'Fetched At',
    'insights.cacheFreshness': 'Cache Freshness',
    'insights.cacheFreshnessValue': 'Real-time',
    'insights.cacheFreshnessDesc': 'Live data',
    localhostIPv6: 'localhost (IPv6)',
    'tabs.overview': 'Overview',
    'tabs.fingerprint': 'Fingerprint Explorer',
    'tabs.fingerprintShort': 'Fingerprint',
    'tabs.analysis': 'Detailed Analysis',
    'tabs.analysisShort': 'Analysis',
    'tabs.monitor': 'Real-time Monitor',
    'tabs.monitorShort': 'Monitor',
    'tabs.toolkit': 'Privacy Toolkit',
    'tabs.toolkitShort': 'Toolkit',
    'tabs.history': 'History',
    'tabs.ipIntel': 'IP Intelligence',
    'tabs.ipIntelShort': 'IP Intel',
    'overview.identityChecks': 'Identity Checks',
    'overview.tapCard': 'Tap a card to see details',
    'overview.extendedToolkit': 'Extended Toolkit',
    'overview.extendedDesc': 'Access advanced leak detection tools',
    'overview.proTip': 'Pro Tip',
    'overview.proTipCritical': 'Critical issues detected - review detailed analysis',
    'overview.proTipDefault': 'Use different tabs to explore various aspects of your digital identity',
    'overview.whatWebsitesSee': 'What Websites See About You',
    'loading.fingerprint': 'Loading fingerprint data...',
    'loading.monitor': 'Loading real-time monitor...',
    'loading.toolkit': 'Loading privacy toolkit...',
    'loading.history': 'Loading history...',
    'analysis.score': 'Score',
    'analysis.confidence': 'Confidence',
    'analysis.entropy': 'Entropy',
    'analysis.breakdown': 'Breakdown',
    'analysis.detailedSignals': 'Detailed Signals',
    'ipIntel.title': 'IP Intelligence Analysis',
    'ipIntel.subtitle': 'Comprehensive IP reputation and network analysis',
    'ipIntel.yourIP': 'Your IP Address',
    'ipIntel.dataSources': 'Data Sources',
    'ipIntel.lastUpdated': 'Last Updated',
    'panels.browser.title': 'Browser',
    'panels.browser.description': 'Browser fingerprint and characteristics',
    'panels.location.title': 'Location',
    'panels.location.description': 'Geolocation and timezone data',
    'panels.ipAddress.title': 'IP Address',
    'panels.ipAddress.description': 'IP reputation and network info',
    'panels.hardware.title': 'Hardware',
    'panels.hardware.description': 'Device hardware specifications',
    'panels.software.title': 'Software',
    'panels.software.description': 'Operating system and software stack',
  },
};

export function useTranslations(namespace: string) {
  return (key: string) => {
    const keys = key.split('.');
    let value: any = translations[namespace];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    return typeof value === 'string' ? value : key;
  };
}
