import type { FingerprintPayload } from '../types/report';

export const hashString = async (input: string) => {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export function drawCanvasSample(canvas: HTMLCanvasElement) {
  canvas.width = 300;
  canvas.height = 150;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');
  context.textBaseline = 'top';
  context.font = '16px Arial';
  context.fillStyle = '#f60';
  context.fillText('iphey::canvas-fingerprint', 2, 2);
}

export async function collectCanvas() {
  const canvas = document.createElement('canvas');
  const start = performance.now();
  drawCanvasSample(canvas);
  return {
    hash: await hashString(canvas.toDataURL()),
    width: canvas.width,
    height: canvas.height,
    renderingTime: performance.now() - start,
  };
}

export async function collectWebGL() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
  if (!gl) throw new Error('WebGL is unavailable');
  try {
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = String(gl.getParameter(debug ? debug.UNMASKED_VENDOR_WEBGL : gl.VENDOR));
    const renderer = String(gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    return {
      hash: await hashString(`${vendor}:${renderer}`),
      vendor,
      renderer,
      version: String(gl.getParameter(gl.VERSION)),
      debugInfoAvailable: Boolean(debug),
      maxTextureSize: Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)),
      extensions: (gl.getSupportedExtensions() ?? []).sort(),
    };
  } finally {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

export async function collectAudio() {
  if (typeof OfflineAudioContext === 'undefined') throw new DOMException('Audio is unsupported', 'NotSupportedError');
  const ctx = new OfflineAudioContext(1, 44100, 44100);
  const oscillator = ctx.createOscillator();
  const compressor = ctx.createDynamicsCompressor();
  oscillator.type = 'triangle';
  oscillator.frequency.value = 10000;
  compressor.threshold.value = -50;
  compressor.knee.value = 40;
  compressor.ratio.value = 12;
  compressor.attack.value = 0;
  compressor.release.value = 0.25;
  oscillator.connect(compressor);
  compressor.connect(ctx.destination);
  oscillator.start(0);
  try {
    const buffer = await ctx.startRendering();
    let sum = 0;
    for (const sample of buffer.getChannelData(0)) sum += Math.abs(sample);
    return {
      hash: await hashString(String(sum)),
      sampleRate: buffer.sampleRate,
      channelCount: buffer.numberOfChannels,
    };
  } finally {
    oscillator.disconnect();
    compressor.disconnect();
  }
}

export function collectBasicFingerprint(): FingerprintPayload {
  return {
    userAgent: navigator.userAgent,
    acceptLanguage: navigator.language,
    languages: Array.from(navigator.languages).slice(0, 5),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    systemTime: new Date().toISOString(),
    screen: { width: screen.width, height: screen.height, colorDepth: screen.colorDepth },
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
    cookiesEnabled: navigator.cookieEnabled,
    webrtcDisabled: typeof RTCPeerConnection === 'undefined',
  };
}

// Bounded metric comparison: observed availability of these names, not an OS font inventory.
export async function collectFonts() {
  const candidates = [
    'Arial',
    'Arial Black',
    'Calibri',
    'Cambria',
    'Candara',
    'Comic Sans MS',
    'Consolas',
    'Courier New',
    'Georgia',
    'Helvetica',
    'Impact',
    'Menlo',
    'Monaco',
    'Palatino',
    'Segoe UI',
    'Tahoma',
    'Times New Roman',
    'Trebuchet MS',
    'Verdana',
    'Noto Sans',
    'Noto Serif',
    'Roboto',
    'Ubuntu',
    'Liberation Sans',
  ];
  const base = ['monospace', 'sans-serif', 'serif'];
  const context = document.createElement('canvas').getContext('2d');
  if (!context) throw new DOMException('Font measurement is unavailable', 'NotSupportedError');
  const sample = 'mmmmmmmmmmlliWW0123456789';
  const width = (font: string) => {
    context.font = `72px ${font}`;
    return context.measureText(sample).width;
  };
  const baselines = base.map(font => width(font));
  const detected = candidates
    .filter(font => base.some((fallback, index) => Math.abs(width(`"${font}", ${fallback}`) - baselines[index]) > 0.01))
    .sort();
  const documentFonts: string[] = [];
  document.fonts?.forEach(font => {
    if (documentFonts.length < 200 && !documentFonts.includes(font.family)) documentFonts.push(font.family);
  });
  return {
    hash: await hashString(detected.join('\n')),
    detected,
    base,
    totalTested: candidates.length,
    documentFonts: documentFonts.sort(),
  };
}

export async function boundedProbe<T>(fn: () => Promise<T>, signal?: AbortSignal, timeoutMs = 3000): Promise<T> {
  signal?.throwIfAborted();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let abort: (() => void) | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(fn),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new DOMException('Probe deadline exceeded', 'TimeoutError')), timeoutMs);
        abort = () => reject(signal?.reason ?? new DOMException('Cancelled', 'AbortError'));
        signal?.addEventListener('abort', abort, { once: true });
      }),
    ]);
  } finally {
    clearTimeout(timer);
    if (abort) signal?.removeEventListener('abort', abort);
  }
}

export const collectFingerprint = async (): Promise<FingerprintPayload> => {
  const base = collectBasicFingerprint();
  const results = await Promise.allSettled([
    boundedProbe(collectCanvas),
    boundedProbe(collectWebGL),
    boundedProbe(collectAudio),
    boundedProbe(collectFonts),
  ]);
  const [canvas, webgl, audio, fonts] = results;
  return {
    ...base,
    ...(canvas.status === 'fulfilled' ? { canvas: canvas.value, canvasFingerprint: canvas.value.hash } : {}),
    ...(webgl.status === 'fulfilled'
      ? { webgl: webgl.value, webglVendor: webgl.value.vendor, webglRenderer: webgl.value.renderer }
      : {}),
    ...(audio.status === 'fulfilled' ? { audio: audio.value, audioFingerprint: audio.value.hash } : {}),
    ...(fonts.status === 'fulfilled'
      ? { fonts: fonts.value.detected, enhancedFonts: fonts.value, fontCount: fonts.value.detected.length }
      : {}),
  };
};

export async function collectPermissions() {
  if (!navigator.permissions?.query)
    throw new DOMException('Permission state queries are unsupported', 'NotSupportedError');
  return Promise.all(
    ['geolocation', 'notifications', 'camera', 'microphone'].map(async name => {
      try {
        const permission = await navigator.permissions.query({ name: name as PermissionName });
        return { name, state: permission.state };
      } catch {
        return { name, state: 'unavailable' as const };
      }
    })
  );
}
