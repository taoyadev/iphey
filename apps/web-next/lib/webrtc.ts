import type { IceCandidateObservation, Observation } from '../../../src/types/scan';
import { parseIP } from '../../../src/utils/networkInput';

export function probeWebRTC(signal?: AbortSignal): Promise<Observation<IceCandidateObservation[]>> {
  const source = 'Browser ICE gathering via stun.l.google.com:19302';
  const limitation =
    'STUN receives your network address. mDNS may hide local addresses; no candidates does not prove absence of leaks. No camera or microphone is requested.';
  if (typeof RTCPeerConnection === 'undefined')
    return Promise.resolve({ status: 'unsupported', value: null, source, observedAt: Date.now(), limitation });
  signal?.throwIfAborted();
  return new Promise(resolve => {
    const candidates: IceCandidateObservation[] = [];
    let pc: RTCPeerConnection | undefined;
    let finished = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (status: Observation['status']) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      if (pc) {
        pc.onicecandidate = null;
        pc.close();
      }
      candidates.sort((a, b) =>
        `${a.type}:${a.address}:${a.protocol}`.localeCompare(`${b.type}:${b.address}:${b.protocol}`)
      );
      resolve({ status, value: candidates.length ? candidates : null, source, observedAt: Date.now(), limitation });
    };
    const abort = () => finish('not-run');
    try {
      pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      signal?.addEventListener('abort', abort, { once: true });
      timer = setTimeout(() => finish(candidates.length ? 'observed' : 'timeout'), 5000);
      pc.onicecandidate = event => {
        if (!event.candidate) {
          finish(candidates.length ? 'observed' : 'no-result');
          return;
        }
        const candidate = event.candidate;
        const parts = candidate.candidate.split(' ');
        const rawAddress = candidate.address ?? parts[4] ?? '';
        const parsed = parseIP(rawAddress);
        const address = parsed?.ip ?? rawAddress;
        const observation: IceCandidateObservation = {
          type: candidate.type ?? parts[7] ?? 'unknown',
          address,
          protocol: candidate.protocol ?? parts[2] ?? 'unknown',
          addressKind: address.endsWith('.local')
            ? 'mdns'
            : parsed?.category === 'public'
              ? 'public'
              : parsed
                ? 'private'
                : 'unknown',
        };
        if (!candidates.some(c => c.address === address && c.type === observation.type)) candidates.push(observation);
      };
      pc.createDataChannel('iphey-check');
      void pc
        .createOffer()
        .then(offer => {
          if (!finished) return pc?.setLocalDescription(offer);
        })
        .catch(() => finish('blocked'));
    } catch {
      finish('blocked');
    }
  });
}
