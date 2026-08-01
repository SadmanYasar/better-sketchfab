import { fetchMock } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import { fetchSketchfabCategories } from '../sketchfabServerFns';
import { callServerFn } from './helpers/callServerFn';

const categoriesResponse = {
  results: [
    { uid: 'characters', name: 'Characters & Creatures', slug: 'characters-creatures' },
    { uid: 'science-technology', name: 'Science & Technology', slug: 'science-technology' },
  ],
};

describe('fetchSketchfabCategories', () => {
  beforeEach(() => {
    fetchMock.activate();
    fetchMock.disableNetConnect();
  });

  it('returns categories from the Sketchfab API', async () => {
    fetchMock
      .get('https://api.sketchfab.com')
      .intercept({ path: '/v3/categories' })
      .reply(200, categoriesResponse, { headers: { 'Content-Type': 'application/json' } });

    const result = await callServerFn(fetchSketchfabCategories, undefined);
    expect(result).toEqual(categoriesResponse);
  });

  it('returns an error when the API responds with a failure status', async () => {
    fetchMock
      .get('https://api.sketchfab.com')
      .intercept({ path: '/v3/categories' })
      .reply(500, { detail: 'boom' }, { headers: { 'Content-Type': 'application/json' } });

    const result = await callServerFn(fetchSketchfabCategories, undefined);
    expect(result).toEqual({ error: 'Failed to fetch Sketchfab categories' });
  });
});
