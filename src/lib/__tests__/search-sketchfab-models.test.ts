import { fetchMock } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import { searchSketchfabModels } from '../sketchfabServerFns';
import { callServerFn } from './helpers/callServerFn';

const searchResult = {
  results: [
    {
      uid: 'abc123',
      name: 'Test Robot',
      description: 'A robot for testing',
      viewerUrl: 'https://sketchfab.com/models/abc123',
      embedUrl: 'https://sketchfab.com/models/abc123/embed',
      faceCount: 1000,
      vertexCount: 500,
      isDownloadable: true,
      publishedAt: '2026-01-01T00:00:00Z',
      viewCount: 10,
      likeCount: 20,
      commentCount: 2,
      categories: [],
      tags: [],
      user: {},
      thumbnails: { images: [] },
    },
  ],
  cursors: { next: 'abc123:5', previous: null },
  total: 1,
};

describe('searchSketchfabModels', () => {
  beforeEach(() => {
    fetchMock.activate();
    fetchMock.disableNetConnect();
  });

  it('returns results from the Sketchfab API', async () => {
    fetchMock
      .get('https://api.sketchfab.com')
      .intercept({
        path: '/v3/search',
        query: {
          type: 'models',
          count: '24',
          sort_by: '-likeCount',
          downloadable: 'true',
          q: 'robot',
        },
      })
      .reply(200, searchResult, { headers: { 'Content-Type': 'application/json' } });

    const result = await callServerFn<
      { q: string },
      { source: string; results: any[]; total: number; cursors: { next: string | null } }
    >(searchSketchfabModels, { q: 'robot' });

    expect(result.source).toBe('sketchfab_api');
    expect(result.results).toHaveLength(1);
    expect(result.results[0].name).toBe('Test Robot');
    expect(result.total).toBe(1);
    expect(result.cursors.next).toBe('abc123:5');
  });

  it('falls back to the featured repository when the API fails', async () => {
    fetchMock
      .get('https://api.sketchfab.com')
      .intercept({
        path: '/v3/search',
        query: {
          type: 'models',
          count: '24',
          sort_by: '-likeCount',
          downloadable: 'true',
          q: 'mech',
        },
      })
      .reply(500, { detail: 'boom' }, { headers: { 'Content-Type': 'application/json' } })
      .persist();

    const result = await callServerFn<
      { q: string },
      { source: string; results: any[]; total: number; cursors: { next: string | null } }
    >(searchSketchfabModels, { q: 'mech' });

    expect(result.source).toBe('featured_repository');
    expect(result.total).toBeGreaterThan(0);
  });
});
