import { fetchMock } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';

describe('fetchMock plumbing', () => {
  beforeEach(() => {
    fetchMock.activate();
    fetchMock.disableNetConnect();
  });
  it('intercepts fetch', async () => {
    fetchMock
      .get('https://api.sketchfab.com')
      .intercept({
        path: '/v3/search',
        query: { type: 'models', count: '24', downloadable: 'true', q: 'robot' },
      })
      .reply(
        200,
        { results: [{ uid: 'm1' }], cursors: { next: null, previous: null }, total: 1 },
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );

    const res = await fetch(
      'https://api.sketchfab.com/v3/search?count=24&downloadable=true&q=robot&type=models',
    );
    const body = await res.json();
    expect(body.results).toHaveLength(1);
  });
});
