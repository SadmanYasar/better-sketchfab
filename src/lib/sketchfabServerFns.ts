import { env } from 'cloudflare:workers';
import { createServerFn } from '@tanstack/react-start';
import { unzip } from 'unzipit';
import { FEATURED_MODELS, MOCK_ADVANCED_METADATA } from '../data/mockModels';
import type { AdvancedModelMetadata } from '../types';

const METADATA_CACHE_TTL_SECONDS = 60 * 60 * 24;

function metadataCacheKey(uid: string) {
  return `metadata:v1:${uid}`;
}

async function getCachedMetadata(uid: string): Promise<AdvancedModelMetadata | null> {
  try {
    const cached = await env.METADATA_CACHE.get<AdvancedModelMetadata>(
      metadataCacheKey(uid),
      'json',
    );
    return cached;
  } catch (err) {
    console.warn('KV metadata cache read failed:', err);
    return null;
  }
}

async function setCachedMetadata(uid: string, metadata: AdvancedModelMetadata) {
  try {
    await env.METADATA_CACHE.put(metadataCacheKey(uid), JSON.stringify(metadata), {
      expirationTtl: METADATA_CACHE_TTL_SECONDS,
    });
  } catch (err) {
    console.warn('KV metadata cache write failed:', err);
  }
}

async function fetchWithSketchfabAuth(url: string, rawToken: string, options: any = {}) {
  const cleaned = rawToken.replace(/^(Bearer|Token)\s+/i, '').trim();
  if (!cleaned) {
    return fetch(url, options);
  }

  const headersToken = {
    ...(options.headers || {}),
    Authorization: `Token ${cleaned}`,
  };

  const res = await fetch(url, { ...options, headers: headersToken });

  if (res.status === 401 || res.status === 403) {
    const headersBearer = {
      ...(options.headers || {}),
      Authorization: `Bearer ${cleaned}`,
    };
    const resBearer = await fetch(url, { ...options, headers: headersBearer });
    if (resBearer.ok) {
      return resBearer;
    }
  }

  return res;
}

function parseGltfManifest(gltf: any) {
  let hasUVs = false;
  let uvLayersCount = 0;
  let hasColors = false;
  let hasMorphs = false;
  let morphTargetsCount = 0;
  let primitivesCount = 0;

  const uvSet = new Set<string>();

  gltf.meshes?.forEach((mesh: any) => {
    mesh.primitives?.forEach((prim: any) => {
      primitivesCount++;
      if (prim.targets && prim.targets.length > 0) {
        hasMorphs = true;
        morphTargetsCount = Math.max(morphTargetsCount, prim.targets.length);
      }
      if (prim.attributes) {
        Object.keys(prim.attributes).forEach((attr) => {
          if (attr.startsWith('TEXCOORD_')) {
            hasUVs = true;
            uvSet.add(attr);
          }
          if (attr.startsWith('COLOR_')) {
            hasColors = true;
          }
        });
      }
    });
  });

  uvLayersCount = uvSet.size || (hasUVs ? 1 : 0);

  const isRigged = !!(gltf.skins && gltf.skins.length > 0);
  let jointCount = 0;
  if (gltf.skins) {
    gltf.skins.forEach((skin: any) => {
      if (skin.joints) jointCount += skin.joints.length;
    });
  }

  const hasAnimations = !!(gltf.animations && gltf.animations.length > 0);
  const animationTracksCount = gltf.animations?.length || 0;

  const hasScaleTransformations =
    gltf.nodes?.some(
      (n: any) => n.scale && (n.scale[0] !== 1 || n.scale[1] !== 1 || n.scale[2] !== 1),
    ) || false;

  return {
    hasUVs,
    uvLayersCount,
    hasVertexColors: hasColors,
    isRigged,
    jointCount,
    hasAnimations,
    animationTracksCount,
    hasMorphGeometries: hasMorphs,
    morphTargetsCount,
    hasScaleTransformations,
    nodesCount: gltf.nodes?.length || 0,
    meshesCount: gltf.meshes?.length || 0,
    primitivesCount,
  };
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

export const fetchSketchfabCategories = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const sfResponse = await fetch('https://api.sketchfab.com/v3/categories', {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Sketchfab3DArtistInspector/1.0',
      },
    });

    if (sfResponse.ok) {
      return await sfResponse.json();
    }
    return { error: 'Failed to fetch Sketchfab categories' };
  } catch (err: any) {
    return { error: err.message };
  }
});

export const searchSketchfabModels = createServerFn({ method: 'GET' })
  .validator((data: Record<string, any>) => data)
  .handler(async ({ data }) => {
    try {
      const {
        q = '',
        sort_by = '-likeCount',
        categories = '',
        pbr_type = '',
        animated = '',
        rigged = '',
        downloadable = 'true',
        staffpicked = '',
        sound = '',
        licenses = '',
        max_face_count = '',
        min_face_count = '',
        count = '24',
        cursor = '',
        unsafe_search = '',
        date = '',
        is_ai = '',
      } = data || {};

      const params = new URLSearchParams({
        type: 'models',
        count: String(count),
      });

      if (q) params.append('q', String(q));
      if (sort_by) params.append('sort_by', String(sort_by));
      if (categories) params.append('categories', String(categories));
      if (pbr_type) params.append('pbr_type', String(pbr_type));
      if (animated) params.append('animated', String(animated));
      if (rigged) params.append('rigged', String(rigged));
      if (downloadable !== '') params.append('downloadable', String(downloadable));
      if (staffpicked) params.append('staffpicked', String(staffpicked));
      if (sound) params.append('sound', String(sound));
      if (licenses) params.append('licenses', String(licenses));
      if (max_face_count) params.append('max_face_count', String(max_face_count));
      if (min_face_count) params.append('min_face_count', String(min_face_count));
      if (cursor) params.append('cursor', String(cursor));
      if (unsafe_search === 'true') params.append('unsafe_search', 'true');
      if (date) params.append('date', String(date));
      if (is_ai) params.append('is_ai', String(is_ai));

      const sketchfabUrl = `https://api.sketchfab.com/v3/search?${params.toString()}`;

      const sfResponse = await fetch(sketchfabUrl, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Sketchfab3DArtistInspector/1.0',
        },
      });

      if (sfResponse.ok) {
        const resData = await sfResponse.json();
        if (resData.results && resData.results.length > 0) {
          return {
            results: resData.results,
            cursors: resData.cursors,
            total: resData.total || resData.results.length,
            source: 'sketchfab_api',
          };
        }
      }

      // Fallback search in featured models
      const queryStr = String(q).toLowerCase();
      const filtered = FEATURED_MODELS.filter((m) => {
        const matchesQuery =
          !queryStr ||
          m.name.toLowerCase().includes(queryStr) ||
          m.description.toLowerCase().includes(queryStr) ||
          m.tags.some((t) => t.name.toLowerCase().includes(queryStr));

        const matchesCategory =
          !categories || m.categories.some((c) => c.slug === categories || c.uid === categories);

        const matchesPbr = !pbr_type || (pbr_type === 'pbr' ? m.isPbr : !m.isPbr);
        const matchesAnimated =
          !animated || (animated === 'true' ? (m.animationCount || 0) > 0 : true);
        const matchesDownloadable = downloadable === 'true' ? m.isDownloadable : true;

        return (
          matchesQuery && matchesCategory && matchesPbr && matchesAnimated && matchesDownloadable
        );
      });

      if (sort_by === '-faceCount') {
        filtered.sort((a, b) => b.faceCount - a.faceCount);
      } else if (sort_by === 'faceCount') {
        filtered.sort((a, b) => a.faceCount - b.faceCount);
      } else if (sort_by === '-likeCount') {
        filtered.sort((a, b) => b.likeCount - a.likeCount);
      } else if (sort_by === '-viewCount') {
        filtered.sort((a, b) => b.viewCount - a.viewCount);
      } else if (sort_by === '-publishedAt') {
        filtered.sort(
          (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
        );
      }

      return {
        results: filtered,
        cursors: { next: null, previous: null },
        total: filtered.length,
        source: 'featured_repository',
      };
    } catch (error: any) {
      return {
        results: FEATURED_MODELS,
        cursors: { next: null, previous: null },
        total: FEATURED_MODELS.length,
        source: 'fallback_repository',
        error: error.message,
      };
    }
  });

export const fetchSketchfabModelDetails = createServerFn({ method: 'GET' })
  .validator((data: { uid: string }) => data)
  .handler(async ({ data }) => {
    const { uid } = data;
    try {
      const sfResponse = await fetch(`https://api.sketchfab.com/v3/models/${uid}`, {
        headers: { Accept: 'application/json' },
      });

      if (sfResponse.ok) {
        return await sfResponse.json();
      }

      const found = FEATURED_MODELS.find((m) => m.uid === uid);
      if (found) return found;

      return { error: 'Model not found', status: 404 };
    } catch (error: any) {
      const found = FEATURED_MODELS.find((m) => m.uid === uid);
      if (found) return found;
      return { error: error.message, status: 500 };
    }
  });

export const fetchModelMetadata = createServerFn({ method: 'GET' })
  .validator((data: { uid: string; sketchfabToken?: string }) => data)
  .handler(async ({ data }) => {
    const { uid, sketchfabToken = '' } = data;

    try {
      const cached = await getCachedMetadata(uid);
      if (cached) {
        return cached;
      }

      let modelData: any = null;
      const sfModelRes = await fetch(`https://api.sketchfab.com/v3/models/${uid}`, {
        headers: { Accept: 'application/json' },
      });

      if (sfModelRes.ok) {
        modelData = await sfModelRes.json();
      } else {
        modelData = FEATURED_MODELS.find((m) => m.uid === uid);
      }

      if (!modelData) {
        return { error: 'Model not found', status: 404 };
      }

      if (sketchfabToken) {
        try {
          const dlRes = await fetchWithSketchfabAuth(
            `https://api.sketchfab.com/v3/models/${uid}/download`,
            sketchfabToken,
            { headers: { Accept: 'application/json' } },
          );

          if (dlRes.ok) {
            const dlData = await dlRes.json();
            const gltfFormat = dlData.gltf || dlData.source || dlData.usdz;
            if (gltfFormat?.url) {
              const zipUrl = gltfFormat.url;
              const downloadSizeBytes = gltfFormat.size || 0;

              const { entries } = await unzip(zipUrl);
              const sceneEntry =
                entries['scene.gltf'] || entries['scene.bin'] || Object.values(entries)[0];

              if (sceneEntry) {
                const gltfText = await sceneEntry.text();
                const gltf = JSON.parse(gltfText);
                const advancedStats = parseGltfManifest(gltf);

                const verifiedMetadata: AdvancedModelMetadata = {
                  isVerifiedGltf: true,
                  basic: {
                    faces:
                      modelData.faceCount ||
                      gltf.meshes?.reduce(
                        (acc: number, m: any) => acc + (m.primitives?.length || 0) * 100,
                        0,
                      ) ||
                      0,
                    vertices: modelData.vertexCount || 0,
                    materials: modelData.materialCount || gltf.materials?.length || 0,
                    textures: modelData.textureCount || gltf.textures?.length || 0,
                    pbrType:
                      modelData.pbrType ||
                      (gltf.materials?.some((m: any) => m.pbrMetallicRoughness)
                        ? 'pbrMetallicRoughness'
                        : 'Standard'),
                    isPbr:
                      modelData.isPbr || gltf.materials?.some((m: any) => m.pbrMetallicRoughness),
                    downloadSize: downloadSizeBytes,
                    downloadSizeFormatted: formatBytes(downloadSizeBytes),
                    animationCount: modelData.animationCount || gltf.animations?.length || 0,
                  },
                  advanced: advancedStats,
                  gltfRawStats: {
                    extensionsUsed: gltf.extensionsUsed || [],
                    generator: gltf.asset?.generator || 'GLTF 2.0 Exporter',
                    version: gltf.asset?.version || '2.0',
                  },
                };

                await setCachedMetadata(uid, verifiedMetadata);

                return verifiedMetadata;
              }
            }
          }
        } catch (dlErr) {
          console.warn('Download API / unzipit manifest extraction attempt failed:', dlErr);
        }
      }

      if (MOCK_ADVANCED_METADATA[uid]) {
        return MOCK_ADVANCED_METADATA[uid];
      }

      const tags = (modelData.tags || []).map((t: any) => (t.name || '').toLowerCase());
      const isRigged =
        tags.includes('rigged') ||
        tags.includes('rig') ||
        tags.includes('skeleton') ||
        (modelData.animationCount > 0 && tags.includes('character'));
      const hasAnimations =
        (modelData.animationCount || 0) > 0 ||
        tags.includes('animated') ||
        tags.includes('animation');
      const hasMorphs =
        tags.includes('morph') ||
        tags.includes('blendshape') ||
        tags.includes('facial') ||
        tags.includes('blendshapes');
      const hasUVs = true;
      const uvLayersCount = tags.includes('lightmap') || tags.includes('uv2') ? 2 : 1;
      const hasColors =
        tags.includes('vertexcolors') ||
        tags.includes('vertex-colors') ||
        tags.includes('photogrammetry');
      const hasScaleTransformations = true;

      const estTexCount = modelData.textureCount || 4;
      const estVertex = modelData.vertexCount || 20000;
      const estimatedBytes = Math.round(estVertex * 120 + estTexCount * 2500000);

      const synthesizedMetadata: AdvancedModelMetadata = {
        isVerifiedGltf: false,
        basic: {
          faces: modelData.faceCount || 0,
          vertices: modelData.vertexCount || 0,
          materials: modelData.materialCount || 1,
          textures: estTexCount,
          pbrType: modelData.pbrType || 'pbrMetallicRoughness',
          isPbr: modelData.isPbr !== undefined ? modelData.isPbr : true,
          downloadSize: estimatedBytes,
          downloadSizeFormatted: formatBytes(estimatedBytes),
          animationCount: modelData.animationCount || 0,
        },
        advanced: {
          hasUVs,
          uvLayersCount,
          hasVertexColors: hasColors,
          isRigged,
          jointCount: isRigged ? 48 : 0,
          hasAnimations,
          animationTracksCount: modelData.animationCount || 0,
          hasMorphGeometries: hasMorphs,
          morphTargetsCount: hasMorphs ? 8 : 0,
          hasScaleTransformations,
          nodesCount: Math.max(12, Math.round((modelData.vertexCount || 10000) / 1000)),
          meshesCount: Math.max(1, modelData.materialCount || 2),
          primitivesCount: Math.max(2, (modelData.materialCount || 2) * 2),
        },
      };

      return synthesizedMetadata;
    } catch (error: any) {
      return { error: error.message, status: 500 };
    }
  });

export const verifySketchfabToken = createServerFn({ method: 'POST' })
  .validator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const { token } = data;
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Token is required' };
    }

    const cleaned = token.replace(/^(Bearer|Token)\s+/i, '').trim();
    if (!cleaned) {
      return { valid: false, error: 'Empty token string' };
    }

    try {
      let sfRes = await fetch('https://api.sketchfab.com/v3/me', {
        headers: {
          Authorization: `Token ${cleaned}`,
          Accept: 'application/json',
        },
      });

      let authType = 'Token';

      if (sfRes.status === 401 || sfRes.status === 403) {
        const sfResBearer = await fetch('https://api.sketchfab.com/v3/me', {
          headers: {
            Authorization: `Bearer ${cleaned}`,
            Accept: 'application/json',
          },
        });
        if (sfResBearer.ok) {
          sfRes = sfResBearer;
          authType = 'Bearer';
        }
      }

      if (sfRes.ok) {
        const userData = await sfRes.json();
        return {
          valid: true,
          user: userData,
          authType,
          token: cleaned,
        };
      }

      const errBody = await sfRes.json().catch(() => ({}));
      return {
        valid: false,
        error: errBody.detail || errBody.message || 'Invalid or expired Sketchfab token',
        status: sfRes.status,
      };
    } catch (err: any) {
      return { valid: false, error: err.message };
    }
  });

export const fetchModelSpritesheet = createServerFn({ method: 'GET' })
  .validator((data: { uid: string }) => data)
  .handler(async ({ data }) => {
    const { uid } = data;
    try {
      const response = await fetch(`https://sketchfab.com/i/models/${uid}/fallback`, {
        headers: { 'User-Agent': 'Sketchfab3DArtistInspector/1.0' },
      });
      if (!response.ok) return { url: null };
      const body = await response.json();
      const images = body?.results?.images;
      if (!images || !Array.isArray(images) || images.length === 0) return { url: null };
      const sorted = [...images].sort((a, b) => (b.width || 0) - (a.width || 0));
      return { url: sorted[0]?.url || null };
    } catch {
      return { url: null };
    }
  });

export const fetchSketchfabDownloadUrl = createServerFn({ method: 'GET' })
  .validator((data: { uid: string; token: string }) => data)
  .handler(async ({ data }) => {
    const { uid, token } = data;
    if (!token) {
      return {
        error: 'Authentication Required',
        message:
          'A Sketchfab OAuth or API token is required to generate direct model download links.',
        status: 401,
      };
    }

    try {
      const dlRes = await fetchWithSketchfabAuth(
        `https://api.sketchfab.com/v3/models/${uid}/download`,
        token,
        { headers: { Accept: 'application/json' } },
      );

      if (!dlRes.ok) {
        const errData = await dlRes.json().catch(() => ({}));
        return { ...errData, status: dlRes.status };
      }

      return await dlRes.json();
    } catch (error: any) {
      return { error: error.message, status: 500 };
    }
  });
