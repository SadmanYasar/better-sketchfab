import { fetchMock } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import { fetchSketchfabDownloadUrl } from '../sketchfabServerFns';
import { callServerFn } from './helpers/callServerFn';

describe('fetchSketchfabDownloadUrl', () => {
  beforeEach(() => {
    fetchMock.activate();
    fetchMock.disableNetConnect();
  });

  it('requires an authentication token', async () => {
    const result = await callServerFn(fetchSketchfabDownloadUrl, { uid: 'dl1', token: '' });
    expect(result).toMatchObject({ error: 'Authentication Required', status: 401 });
  });

  it('returns the download payload from the Sketchfab API', async () => {
    const downloadPayload = {
      gltf: { url: 'https://cdn.sketchfab.com/zipfile/dl.glb', size: 2048 },
    };
    fetchMock
      .get('https://api.sketchfab.com')
      .intercept({ path: '/v3/models/dl1/download' })
      .reply(200, downloadPayload, { headers: { 'Content-Type': 'application/json' } });

    const result = await callServerFn(fetchSketchfabDownloadUrl, { uid: 'dl1', token: 'tok1' });
    expect(result).toEqual(downloadPayload);
  });

  it('falls back to Bearer auth when the Token scheme is rejected', async () => {
    const downloadPayload = {
      gltf: { url: 'https://cdn.sketchfab.com/zipfile/bearer.glb', size: 4096 },
    };
    fetchMock
      .get('https://api.sketchfab.com')
      .intercept({ path: '/v3/models/dl1/download' })
      .reply(401, { detail: 'nope' }, { headers: { 'Content-Type': 'application/json' } })
      .times(1);
    fetchMock
      .get('https://api.sketchfab.com')
      .intercept({ path: '/v3/models/dl1/download' })
      .reply(200, downloadPayload, { headers: { 'Content-Type': 'application/json' } });

    const result = await callServerFn(fetchSketchfabDownloadUrl, {
      uid: 'dl1',
      token: 'bearer-tok',
    });
    expect(result).toEqual(downloadPayload);
  });

  it('propagates an error status from the API', async () => {
    fetchMock
      .get('https://api.sketchfab.com')
      .intercept({ path: '/v3/models/dl1/download' })
      .reply(403, { detail: 'Forbidden' }, { headers: { 'Content-Type': 'application/json' } })
      .persist();

    const result = await callServerFn(fetchSketchfabDownloadUrl, { uid: 'dl1', token: 'tok2' });
    expect(result).toMatchObject({ detail: 'Forbidden', status: 403 });
  });
});
