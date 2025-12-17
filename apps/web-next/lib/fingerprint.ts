import type { FingerprintPayload } from '../types/report';

type WebGLInfo = { vendor?: string; renderer?: string };

const hashString = async (input: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
};

const getCanvasFingerprint = async () => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return undefined;
  context.textBaseline = 'top';
  context.font = '16px "Arial"';
  context.fillStyle = '#f60';
  context.fillText('iphey::canvas-fingerprint', 2, 2);
  const data = canvas.toDataURL();
  return hashString(data);
};

const getWebGLInfo = (): WebGLInfo => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (!gl) return {};
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    return { vendor: vendor?.toString(), renderer: renderer?.toString() };
  } catch {
    return {};
  }
};

const getAudioFingerprint = async () => {
  try {
    const ctx = new OfflineAudioContext(1, 44100, 44100);
    const oscillator = ctx.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.value = 10000;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;

    oscillator.connect(compressor);
    compressor.connect(ctx.destination);
    oscillator.start(0);

    const buffer = await ctx.startRendering();
    let sum = 0;
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < channelData.length; i++) {
      sum += Math.abs(channelData[i]);
    }
    return hashString(sum.toString());
  } catch {
    return undefined;
  }
};

const getFonts = () => {
  const fonts: string[] = [];
  const fontSet = document.fonts;
  if (fontSet && typeof fontSet.forEach === 'function') {
    fontSet.forEach(font => {
      if (font.family) fonts.push(font.family);
    });
  }
  if (!fonts.length) {
    fonts.push('system-ui');
  }
  return fonts;
};

const getClientRectsHash = async () => {
  const el = document.createElement('div');
  el.style.cssText =
    'position:absolute;left:-9999px;top:-9999px;font-size:13px;font-family:Arial;width:200px;height:200px;';
  el.textContent = 'iphey-client-rect';
  document.body.appendChild(el);
  const rect = el.getBoundingClientRect();
  document.body.removeChild(el);
  return hashString(`${rect.width}-${rect.height}-${rect.top}-${rect.left}`);
};

export const collectFingerprint = async (): Promise<FingerprintPayload> => {
  const { vendor: webglVendor, renderer: webglRenderer } = getWebGLInfo();
  const [canvasFingerprint, audioFingerprint, clientRectsHash] = await Promise.all([
    getCanvasFingerprint(),
    getAudioFingerprint(),
    getClientRectsHash(),
  ]);

  const fonts = getFonts();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const languages = navigator.languages?.slice(0, 5) ?? [navigator.language];
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const javaEnabled = typeof navigator.javaEnabled === 'function' ? navigator.javaEnabled() : false;
  const flashEnabled = navigator.plugins?.namedItem?.('Shockwave Flash') != null;
  const webrtcDisabled = typeof RTCPeerConnection === 'undefined';

  return {
    userAgent: navigator.userAgent,
    acceptLanguage: navigator.language,
    languages,
    timezone,
    systemTime: new Date().toISOString(),
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      colorDepth: window.screen.colorDepth,
    },
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory,
    webglVendor,
    webglRenderer,
    canvasFingerprint,
    audioFingerprint,
    clientRectsHash,
    legacyFonts: fonts,
    fontCount: fonts.length,
    cookiesEnabled: navigator.cookieEnabled,
    javaEnabled,
    flashEnabled,
    webrtcDisabled,
  };
};
