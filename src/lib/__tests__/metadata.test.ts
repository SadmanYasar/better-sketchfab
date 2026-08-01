import { fetchMock } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import { fetchModelMetadata } from '../sketchfabServerFns';
import { callServerFn } from './helpers/callServerFn';
import { buildMinimalZip } from './helpers/zip';

const gltfJson = JSON.stringify({
  asset: { version: '2.0', generator: 'glTF-Exporter test' },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ name: 'Root', scale: [2, 2, 2] }],
  meshes: [
    {
      primitives: [
        {
          attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 },
          targets: [{ POSITION: 3 }],
        },
      ],
    },
  ],
  materials: [{ pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1] } }],
  skins: [{ joints: [0, 1, 2, 3] }],
  animations: [{ name: 'walk' }],
});

const modelApiResponse = {
  uid: 'meta1',
  name: 'Metadata Model',
  vertexCount: 1200,
  faceCount: 2400,
  materialCount: 2,
  textureCount: 3,
  animationCount: 1,
  tags: [],
};

const downloadResponse = {
  gltf: { url: 'https://cdn.sketchfab.com/zipfile/sample.glb', size: 512 },
};

describe('fetchModelMetadata', () => {
  beforeEach(() => {
    fetchMock.activate();
    fetchMock.disableNetConnect();
  });

  it('verifies GLTF from the download archive and extracts advanced stats', async () => {
    const zip = buildMinimalZip('scene.gltf', gltfJson);

    fetchMock
      .get('https://api.sketchfab.com')
      .intercept({ path: '/v3/models/meta1' })
      .reply(200, modelApiResponse, { headers: { 'Content-Type': 'application/json' } });

    fetchMock
      .get('https://api.sketchfab.com')
      .intercept({ path: '/v3/models/meta1/download' })
      .reply(200, downloadResponse, { headers: { 'Content-Type': 'application/json' } });

    fetchMock
      .get('https://cdn.sketchfab.com')
      .intercept({ path: '/zipfile/sample.glb' })
      .reply((opts: any) => {
        if (opts.method === 'HEAD') {
          return {
            statusCode: 200,
            data: '',
            responseOptions: { headers: { 'Content-Length': String(zip.length) } },
          };
        }
        const range = opts.headers?.range || opts.headers?.Range;
        if (typeof range === 'string' && range.startsWith('bytes=')) {
          const [startStr, endStr] = range.replace('bytes=', '').split('-');
          const start = parseInt(startStr, 10);
          const end = endStr ? parseInt(endStr, 10) : zip.length - 1;
          return {
            statusCode: 206,
            data: zip.slice(start, end + 1),
            responseOptions: {
              headers: { 'Content-Range': `bytes ${start}-${end}/${zip.length}` },
            },
          };
        }
        return { statusCode: 200, data: zip };
      })
      .persist();

    const result = await callServerFn(fetchModelMetadata, {
      uid: 'meta1',
      sketchfabToken: 'tok123',
    });

    expect(result).toMatchObject({
      isVerifiedGltf: true,
    });
    const stats = (result as any).advanced;
    expect(stats.hasUVs).toBe(true);
    expect(stats.uvLayersCount).toBe(1);
    expect(stats.hasMorphGeometries).toBe(true);
    expect(stats.morphTargetsCount).toBe(1);
    expect(stats.isRigged).toBe(true);
    expect(stats.jointCount).toBe(4);
    expect(stats.hasAnimations).toBe(true);
    expect(stats.animationTracksCount).toBe(1);
    expect(stats.hasScaleTransformations).toBe(true);
    expect(stats.nodesCount).toBe(1);
    expect(stats.meshesCount).toBe(1);
    expect(stats.primitivesCount).toBe(1);
    expect((result as any).basic.downloadSize).toBe(512);
  });
});
