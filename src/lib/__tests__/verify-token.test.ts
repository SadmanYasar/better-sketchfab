import { fetchMock } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import { verifySketchfabToken } from '../sketchfabServerFns';
import { callServerFn } from './helpers/callServerFn';

describe('verifySketchfabToken', () => {
  beforeEach(() => {
    fetchMock.activate();
    fetchMock.disableNetConnect();
  });

  it('rejects missing and empty tokens', async () => {
    expect(await callServerFn(verifySketchfabToken, { token: '' })).toMatchObject({
      valid: false,
      error: 'Token is required',
    });
    expect(await callServerFn(verifySketchfabToken, { token: '  ' })).toMatchObject({
      valid: false,
      error: 'Empty token string',
    });
  });

  it('accepts a valid token via the Token auth scheme', async () => {
    fetchMock
      .get('https://api.sketchfab.com')
      .intercept({ path: '/v3/me' })
      .reply(200, { username: 'tester' }, { headers: { 'Content-Type': 'application/json' } });

    const result = await callServerFn(verifySketchfabToken, { token: 'tok-valid' });
    expect(result).toMatchObject({ valid: true, authType: 'Token', token: 'tok-valid' });
  });

  it('falls back to the Bearer auth scheme on 401', async () => {
    fetchMock
      .get('https://api.sketchfab.com')
      .intercept({ path: '/v3/me' })
      .reply(401, { detail: 'Invalid' }, { headers: { 'Content-Type': 'application/json' } })
      .times(1);

    fetchMock
      .get('https://api.sketchfab.com')
      .intercept({ path: '/v3/me' })
      .reply(200, { username: 'bearer-user' }, { headers: { 'Content-Type': 'application/json' } });

    const result = await callServerFn(verifySketchfabToken, { token: 'bearer-valid' });
    expect(result).toMatchObject({ valid: true, authType: 'Bearer', token: 'bearer-valid' });
  });

  it('reports an invalid token when all auth schemes fail', async () => {
    fetchMock
      .get('https://api.sketchfab.com')
      .intercept({ path: '/v3/me' })
      .reply(401, { detail: 'Invalid token.' }, { headers: { 'Content-Type': 'application/json' } })
      .persist();

    const result = await callServerFn(verifySketchfabToken, { token: 'bad-token' });
    expect(result).toMatchObject({ valid: false, error: 'Invalid token.', status: 401 });
  });
});
