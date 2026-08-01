import { fetchMock } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildSketchfabAuthUrl, exchangeSketchfabCode, responseFromResult } from '../sketchfabAuth';

describe('exchangeSketchfabCode', () => {
  beforeEach(() => {
    fetchMock.activate();
    fetchMock.disableNetConnect();
  });

  it('requires code, client_id, and client_secret', async () => {
    const result = await exchangeSketchfabCode({ code: 'abc', redirectUri: 'http://l/auth' });
    expect(result.status).toBe(400);
    expect(result.body.error).toContain('client_id');
  });

  it('exchanges an authorization code and sets the token cookie', async () => {
    fetchMock
      .get('https://sketchfab.com')
      .intercept({ method: 'POST', path: '/oauth2/token/' })
      .reply(
        200,
        { access_token: 'access-123' },
        { headers: { 'Content-Type': 'application/json' } },
      );
    fetchMock
      .get('https://api.sketchfab.com')
      .intercept({ path: '/v3/me' })
      .reply(200, { username: 'oauth-user' }, { headers: { 'Content-Type': 'application/json' } });

    const result = await exchangeSketchfabCode({
      code: 'code-1',
      clientId: 'cid',
      clientSecret: 'csecret',
      redirectUri: 'http://localhost/auth/callback',
    });

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ success: true, token: 'access-123', authType: 'Bearer' });
    expect((result.body.user as any).username).toBe('oauth-user');
    expect(result.setCookie).toContain('sketchfab_token=access-123');
    expect(result.setCookie).toContain('HttpOnly');

    const res = responseFromResult(result);
    expect(res.headers.get('Set-Cookie')).toContain('HttpOnly');
  });

  it('surfaces a failed token exchange', async () => {
    fetchMock
      .get('https://sketchfab.com')
      .intercept({ method: 'POST', path: '/oauth2/token/' })
      .reply(400, 'bad code', { headers: { 'Content-Type': 'text/plain' } });

    const result = await exchangeSketchfabCode({
      code: 'bad',
      clientId: 'cid',
      clientSecret: 'csecret',
      redirectUri: 'http://localhost/auth/callback',
    });

    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Token exchange failed');
    expect(result.body.details).toBe('bad code');
  });
});

describe('buildSketchfabAuthUrl', () => {
  it('builds an authorization URL with the provided client id', () => {
    const result = buildSketchfabAuthUrl({
      origin: 'http://localhost',
      clientId: 'custom-cid',
      state: 'st-123',
    });
    expect(result.status).toBe(200);
    expect(result.body.clientId).toBe('custom-cid');
    expect(result.body.redirectUri).toBe('http://localhost/auth/callback');
    expect(result.body.url).toContain('https://sketchfab.com/oauth2/authorize/');
    expect(result.body.url).toContain('state=st-123');
  });

  it('returns an error when no client id is available', () => {
    const result = buildSketchfabAuthUrl({ origin: 'http://localhost' });
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('NO_CLIENT_ID');
  });
});
