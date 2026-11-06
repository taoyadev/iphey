import { afterEach, it, expect, vi } from 'vitest';
import { probeWebRTC } from '../webrtc';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
class Peer {
  static latest: Peer;
  onicecandidate: ((event: { candidate: unknown }) => void) | null = null;
  closed = false;
  constructor() {
    Peer.latest = this;
  }
  createDataChannel() {
    return {};
  }
  async createOffer() {
    return {};
  }
  async setLocalDescription() {
    return;
  }
  close() {
    this.closed = true;
  }
}
it('reports unsupported API without a safety conclusion', async () => {
  vi.stubGlobal('RTCPeerConnection', undefined);
  expect(await probeWebRTC()).toMatchObject({ status: 'unsupported', value: null });
});
it('separates mDNS, private and normalized public candidates and closes the connection', async () => {
  vi.stubGlobal('RTCPeerConnection', Peer);
  const pending = probeWebRTC();
  for (const [address, type] of [
    ['host.local', 'host'],
    ['192.168.1.2', 'host'],
    ['2606:4700:4700:0:0:0:0:1111', 'srflx'],
  ])
    Peer.latest.onicecandidate?.({ candidate: { address, type, protocol: 'udp', candidate: '' } });
  Peer.latest.onicecandidate?.({ candidate: null });
  const result = await pending;
  expect(result.status).toBe('observed');
  expect(result.value?.map(item => item.addressKind).sort()).toEqual(['mdns', 'private', 'public']);
  expect(result.value?.some(item => item.address === '2606:4700:4700::1111')).toBe(true);
  expect(Peer.latest.closed).toBe(true);
});
it('bounds no-candidate gathering and closes on cancellation', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('RTCPeerConnection', Peer);
  const pending = probeWebRTC();
  await vi.advanceTimersByTimeAsync(5000);
  expect(await pending).toMatchObject({ status: 'timeout', value: null });
  expect(Peer.latest.closed).toBe(true);
  const controller = new AbortController();
  const cancelled = probeWebRTC(controller.signal);
  controller.abort();
  expect(await cancelled).toMatchObject({ status: 'not-run' });
  expect(Peer.latest.closed).toBe(true);
});
