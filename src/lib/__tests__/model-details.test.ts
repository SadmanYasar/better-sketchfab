import { fetchMock } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import { fetchSketchfabModelDetails } from '../sketchfabServerFns';
import { callServerFn } from './helpers/callServerFn';

const modelDetailsResponse = {
  uid: 'det1',
  name: 'Detailed Model',
  vertexCount: 800,
  faceCount: 1600,
};

describe('fetchSketchfabModelDetails', () => {
  beforeEach(() => {
    fetchMock.activate();
    fetchMock.disableNetConnect();
  });

  it('returns model details from the Sketchfab API', async () => {
    fetchMock
      .get('https://api.sketchfab.com')
      .intercept({ path: '/v3/models/det1' })
      .reply(200, modelDetailsResponse, { headers: { 'Content-Type': 'application/json' } });

    const result = await callServerFn(fetchSketchfabModelDetails, { uid: 'det1' });
    expect(result).toEqual(modelDetailsResponse);
  });

  it('returns a 404 error for an unknown model', async () => {
    fetchMock
      .get('https://api.sketchfab.com')
      .intercept({ path: '/v3/models/nope' })
      .reply(404, { detail: 'Not found' }, { headers: { 'Content-Type': 'application/json' } });

    const result = await callServerFn(fetchSketchfabModelDetails, { uid: 'nope' });
    expect(result).toEqual({ error: 'Model not found', status: 404 });
  });
});
