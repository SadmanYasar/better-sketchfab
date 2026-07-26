import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { unzip } from 'unzipit';
import dotenv from 'dotenv';
import { FEATURED_MODELS, MOCK_ADVANCED_METADATA } from './src/data/mockModels.js';
import { AdvancedModelMetadata } from './src/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchWithSketchfabAuth(url: string, rawToken: string, options: any = {}) {
  const cleaned = rawToken.replace(/^(Bearer|Token)\s+/i, '').trim();
  if (!cleaned) {
    return fetch(url, options);
  }

  const headersToken = {
    ...(options.headers || {}),
    'Authorization': `Token ${cleaned}`
  };

  let res = await fetch(url, { ...options, headers: headersToken });

  if (res.status === 401 || res.status === 403) {
    const headersBearer = {
      ...(options.headers || {}),
      'Authorization': `Bearer ${cleaned}`
    };
    const resBearer = await fetch(url, { ...options, headers: headersBearer });
    if (resBearer.ok) {
      return resBearer;
    }
  }

  return res;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 1. Search Sketchfab Models Proxy
  app.get('/api/sketchfab/categories', async (_req, res) => {
    try {
      const sfResponse = await fetch('https://api.sketchfab.com/v3/categories', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Sketchfab3DArtistInspector/1.0'
        }
      });

      if (sfResponse.ok) {
        const data = await sfResponse.json();
        return res.json(data);
      }
      return res.status(sfResponse.status).json({ error: 'Failed to fetch Sketchfab categories' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/sketchfab/search', async (req, res) => {
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
        cursor = ''
      } = req.query;

      const params = new URLSearchParams({
        type: 'models',
        count: String(count)
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

      const sketchfabUrl = `https://api.sketchfab.com/v3/search?${params.toString()}`;
      
      const sfResponse = await fetch(sketchfabUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Sketchfab3DArtistInspector/1.0'
        }
      });

      if (sfResponse.ok) {
        const data = await sfResponse.json();
        if (data.results && data.results.length > 0) {
          return res.json({
            results: data.results,
            cursors: data.cursors,
            total: data.total || data.results.length,
            source: 'sketchfab_api'
          });
        }
      }

      // Fallback search in featured models if Sketchfab API is unavailable or returns 0 results
      const queryStr = String(q).toLowerCase();
      let filtered = FEATURED_MODELS.filter(m => {
        const matchesQuery = !queryStr || 
          m.name.toLowerCase().includes(queryStr) || 
          m.description.toLowerCase().includes(queryStr) ||
          m.tags.some(t => t.name.toLowerCase().includes(queryStr));

        const matchesCategory = !categories || 
          m.categories.some(c => c.slug === categories || c.uid === categories);

        const matchesPbr = !pbr_type || (pbr_type === 'pbr' ? m.isPbr : !m.isPbr);
        const matchesAnimated = !animated || (animated === 'true' ? (m.animationCount || 0) > 0 : true);
        const matchesDownloadable = downloadable === 'true' ? m.isDownloadable : true;

        return matchesQuery && matchesCategory && matchesPbr && matchesAnimated && matchesDownloadable;
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
        filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      }

      return res.json({
        results: filtered,
        cursors: { next: null, previous: null },
        total: filtered.length,
        source: 'featured_repository'
      });
    } catch (error: any) {
      console.error('Error proxying Sketchfab search:', error);
      // Fallback to local featured models
      return res.json({
        results: FEATURED_MODELS,
        cursors: { next: null, previous: null },
        total: FEATURED_MODELS.length,
        source: 'fallback_repository',
        error: error.message
      });
    }
  });

  // 2. Fetch Individual Model Data from Sketchfab
  app.get('/api/sketchfab/models/:uid', async (req, res) => {
    const { uid } = req.params;
    try {
      const sfResponse = await fetch(`https://api.sketchfab.com/v3/models/${uid}`, {
        headers: { 'Accept': 'application/json' }
      });

      if (sfResponse.ok) {
        const modelData = await sfResponse.json();
        return res.json(modelData);
      }

      // Check featured list
      const found = FEATURED_MODELS.find(m => m.uid === uid);
      if (found) {
        return res.json(found);
      }

      return res.status(404).json({ error: 'Model not found' });
    } catch (error: any) {
      console.error('Error fetching model:', error);
      const found = FEATURED_MODELS.find(m => m.uid === uid);
      if (found) return res.json(found);
      return res.status(500).json({ error: error.message });
    }
  });

  // 3. Deep Technical Metadata Inspector Endpoint
  app.get('/api/sketchfab/metadata/:uid', async (req, res) => {
    const { uid } = req.params;
    const authHeader = req.headers.authorization;
    const tokenQuery = req.query.sketchfab_token as string;
    const token = (authHeader ? authHeader.replace('Bearer ', '') : '') || tokenQuery || process.env.SKETCHFAB_OAUTH_TOKEN || '';

    try {
      // Step A: Fetch base Sketchfab Model statistics
      let modelData: any = null;
      const sfModelRes = await fetch(`https://api.sketchfab.com/v3/models/${uid}`, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (sfModelRes.ok) {
        modelData = await sfModelRes.json();
      } else {
        modelData = FEATURED_MODELS.find(m => m.uid === uid);
      }

      if (!modelData) {
        return res.status(404).json({ error: 'Model not found' });
      }

      // Step B: If Sketchfab Auth Token is available, attempt download API + remote GLTF manifest range inspection
      if (token) {
        try {
          const dlRes = await fetchWithSketchfabAuth(`https://api.sketchfab.com/v3/models/${uid}/download`, token, {
            headers: { 'Accept': 'application/json' }
          });

          if (dlRes.ok) {
            const dlData = await dlRes.json();
            const gltfFormat = dlData.gltf || dlData.source || dlData.usdz;
            if (gltfFormat && gltfFormat.url) {
              const zipUrl = gltfFormat.url;
              const downloadSizeBytes = gltfFormat.size || 0;

              // Use unzip HTTP Range request to fetch scene.gltf manifest only!
              const { entries } = await unzip(zipUrl);
              const sceneEntry = entries['scene.gltf'] || entries['scene.bin'] || Object.values(entries)[0];

              if (sceneEntry) {
                const gltfText = await sceneEntry.text();
                const gltf = JSON.parse(gltfText);

                const advancedStats = parseGltfManifest(gltf);

                const verifiedMetadata: AdvancedModelMetadata = {
                  isVerifiedGltf: true,
                  basic: {
                    faces: modelData.faceCount || gltf.meshes?.reduce((acc: number, m: any) => acc + (m.primitives?.length || 0) * 100, 0) || 0,
                    vertices: modelData.vertexCount || 0,
                    materials: modelData.materialCount || gltf.materials?.length || 0,
                    textures: modelData.textureCount || gltf.textures?.length || 0,
                    pbrType: modelData.pbrType || (gltf.materials?.some((m: any) => m.pbrMetallicRoughness) ? 'pbrMetallicRoughness' : 'Standard'),
                    isPbr: modelData.isPbr || gltf.materials?.some((m: any) => m.pbrMetallicRoughness),
                    downloadSize: downloadSizeBytes,
                    downloadSizeFormatted: formatBytes(downloadSizeBytes),
                    animationCount: modelData.animationCount || gltf.animations?.length || 0
                  },
                  advanced: advancedStats,
                  gltfRawStats: {
                    extensionsUsed: gltf.extensionsUsed || [],
                    generator: gltf.asset?.generator || 'GLTF 2.0 Exporter',
                    version: gltf.asset?.version || '2.0'
                  }
                };

                return res.json(verifiedMetadata);
              }
            }
          }
        } catch (dlErr) {
          console.warn('Download API / unzipit manifest extraction attempt failed:', dlErr);
        }
      }

      // Step C: Check pre-computed metadata map
      if (MOCK_ADVANCED_METADATA[uid]) {
        return res.json(MOCK_ADVANCED_METADATA[uid]);
      }

      // Step D: Heuristic synthesis based on Sketchfab Data API tags & properties
      const tags = (modelData.tags || []).map((t: any) => (t.name || '').toLowerCase());
      const categories = (modelData.categories || []).map((c: any) => (c.name || '').toLowerCase());
      
      const isRigged = tags.includes('rigged') || tags.includes('rig') || tags.includes('skeleton') || (modelData.animationCount > 0 && tags.includes('character'));
      const hasAnimations = (modelData.animationCount || 0) > 0 || tags.includes('animated') || tags.includes('animation');
      const hasMorphs = tags.includes('morph') || tags.includes('blendshape') || tags.includes('facial') || tags.includes('blendshapes');
      const hasUVs = true; // Virtually all downloadable Sketchfab models feature UV unwrapping
      const uvLayersCount = tags.includes('lightmap') || tags.includes('uv2') ? 2 : 1;
      const hasColors = tags.includes('vertexcolors') || tags.includes('vertex-colors') || tags.includes('photogrammetry');
      const hasScaleTransformations = true;

      // Estimate archive size based on vertex/texture density
      const estTexCount = modelData.textureCount || 4;
      const estVertex = modelData.vertexCount || 20000;
      const estimatedBytes = Math.round((estVertex * 120) + (estTexCount * 2500000));

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
          animationCount: modelData.animationCount || 0
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
          primitivesCount: Math.max(2, (modelData.materialCount || 2) * 2)
        }
      };

      return res.json(synthesizedMetadata);
    } catch (error: any) {
      console.error('Error generating model metadata:', error);
      return res.status(500).json({ error: error.message });
    }
  });

  // 4. Token Verification Proxy Endpoint (Handles both API Token and OAuth Bearer tokens)
  app.post('/api/sketchfab/verify-token', async (req, res) => {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ valid: false, error: 'Token is required' });
    }

    const cleaned = token.replace(/^(Bearer|Token)\s+/i, '').trim();
    if (!cleaned) {
      return res.status(400).json({ valid: false, error: 'Empty token string' });
    }

    try {
      // First try Token header format (Sketchfab Personal API Token format)
      let sfRes = await fetch('https://api.sketchfab.com/v3/me', {
        headers: {
          'Authorization': `Token ${cleaned}`,
          'Accept': 'application/json'
        }
      });

      let authType = 'Token';

      // If 401 or 403, try Bearer header format (Sketchfab OAuth2 Access Token format)
      if (sfRes.status === 401 || sfRes.status === 403) {
        const sfResBearer = await fetch('https://api.sketchfab.com/v3/me', {
          headers: {
            'Authorization': `Bearer ${cleaned}`,
            'Accept': 'application/json'
          }
        });
        if (sfResBearer.ok) {
          sfRes = sfResBearer;
          authType = 'Bearer';
        }
      }

      if (sfRes.ok) {
        const userData = await sfRes.json();
        return res.json({
          valid: true,
          user: userData,
          authType,
          token: cleaned
        });
      }

      const errBody = await sfRes.json().catch(() => ({}));
      return res.status(sfRes.status).json({
        valid: false,
        error: errBody.detail || errBody.message || 'Invalid or expired Sketchfab token',
        status: sfRes.status
      });
    } catch (err: any) {
      return res.status(500).json({ valid: false, error: err.message });
    }
  });

  // 5. OAuth: Construct Sketchfab Authorization URL
  app.get('/api/auth/sketchfab/url', (req, res) => {
    const customClientId = req.query.client_id as string;
    const clientId = customClientId || process.env.SKETCHFAB_CLIENT_ID;

    const origin = process.env.APP_URL 
      ? process.env.APP_URL.replace(/\/$/, '') 
      : `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${origin}/auth/callback`;

    if (!clientId) {
      return res.status(400).json({
        error: 'NO_CLIENT_ID',
        message: 'Sketchfab OAuth Client ID is missing. Please configure SKETCHFAB_CLIENT_ID in your environment or enter it in the OAuth modal.',
        redirectUri
      });
    }

    const state = req.query.state as string || Math.random().toString(36).substring(2, 15);
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state
    });

    const authUrl = `https://sketchfab.com/oauth2/authorize/?${params.toString()}`;

    return res.json({
      url: authUrl,
      clientId,
      redirectUri
    });
  });

  // 6. OAuth Callback Handlers (/auth/callback & /auth/callback/)
  const handleOAuthCallback = async (req: express.Request, res: express.Response) => {
    const { code, error, error_description } = req.query;

    if (error) {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Sketchfab Auth Error</title></head>
          <body style="background:#0A0A0B;color:#fff;font-family:sans-serif;padding:2rem;text-align:center;">
            <h3 style="color:#f87171;">Authorization Refused or Failed</h3>
            <p style="color:#a1a1aa;font-size:14px;">${error_description || error}</p>
            <script>setTimeout(() => window.close(), 3000);</script>
          </body>
        </html>
      `);
    }

    if (!code) {
      return res.status(400).send('Missing authorization code');
    }

    const origin = process.env.APP_URL 
      ? process.env.APP_URL.replace(/\/$/, '') 
      : `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${origin}/auth/callback`;

    const clientId = process.env.SKETCHFAB_CLIENT_ID;
    const clientSecret = process.env.SKETCHFAB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      // Send code to parent window so client can perform exchange if custom credentials used
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Sketchfab Auth</title></head>
          <body style="background:#0A0A0B;color:#fff;font-family:sans-serif;padding:2rem;text-align:center;">
            <h3 style="color:#818cf8;">Sketchfab Authorization Received</h3>
            <p style="color:#a1a1aa;font-size:14px;">Finishing authorization sequence...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_CODE_RECEIVED',
                  code: '${code}',
                  redirectUri: '${redirectUri}'
                }, '*');
              }
            </script>
          </body>
        </html>
      `);
    }

    try {
      const tokenRes = await fetch('https://sketchfab.com/oauth2/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: String(code),
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri
        }).toString()
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head><title>Token Exchange Failed</title></head>
            <body style="background:#0A0A0B;color:#fff;font-family:sans-serif;padding:2rem;text-align:center;">
              <h3 style="color:#f87171;">Token Exchange Failed</h3>
              <p style="color:#a1a1aa;font-size:13px;font-family:monospace;">${errText}</p>
              <script>setTimeout(() => window.close(), 4000);</script>
            </body>
          </html>
        `);
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      let user = null;
      if (accessToken) {
        const userRes = await fetch('https://api.sketchfab.com/v3/me', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (userRes.ok) {
          user = await userRes.json();
        }
      }

      res.cookie('sketchfab_token', accessToken, {
        secure: true,
        sameSite: 'none',
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      return res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Authentication Successful</title></head>
          <body style="background:#0A0A0B;color:#fff;font-family:sans-serif;padding:2rem;text-align:center;">
            <h3 style="color:#34d399;">Connected to Sketchfab!</h3>
            <p style="color:#a1a1aa;font-size:14px;">Closing window...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_AUTH_SUCCESS',
                  token: '${accessToken}',
                  user: ${JSON.stringify(user || {})},
                  authType: 'Bearer'
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
          </body>
        </html>
      `);
    } catch (err: any) {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Auth Exception</title></head>
          <body style="background:#0A0A0B;color:#fff;font-family:sans-serif;padding:2rem;text-align:center;">
            <h3 style="color:#f87171;">Authentication Exception</h3>
            <p style="color:#a1a1aa;font-size:14px;">${err.message}</p>
            <script>setTimeout(() => window.close(), 4000);</script>
          </body>
        </html>
      `);
    }
  };

  app.get('/auth/callback', handleOAuthCallback);
  app.get('/auth/callback/', handleOAuthCallback);

  // 7. OAuth Code Exchange (for client-supplied credentials)
  app.post('/api/auth/sketchfab/exchange', async (req, res) => {
    const { code, clientId, clientSecret, redirectUri } = req.body;
    const cId = clientId || process.env.SKETCHFAB_CLIENT_ID;
    const cSecret = clientSecret || process.env.SKETCHFAB_CLIENT_SECRET;

    if (!cId || !cSecret || !code) {
      return res.status(400).json({ error: 'Code, client_id, and client_secret are required' });
    }

    try {
      const tokenRes = await fetch('https://sketchfab.com/oauth2/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: cId,
          client_secret: cSecret,
          redirect_uri: redirectUri
        }).toString()
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        return res.status(tokenRes.status).json({ error: 'Token exchange failed', details: errText });
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      const userRes = await fetch('https://api.sketchfab.com/v3/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      const user = userRes.ok ? await userRes.json() : null;

      res.cookie('sketchfab_token', accessToken, {
        secure: true,
        sameSite: 'none',
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      return res.json({
        success: true,
        token: accessToken,
        user,
        authType: 'Bearer'
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 4. Download URL Proxy
  app.get('/api/sketchfab/download/:uid', async (req, res) => {
    const { uid } = req.params;
    const authHeader = req.headers.authorization;
    const token = (authHeader ? authHeader.replace(/^(Bearer|Token)\s+/i, '') : '') || (req.query.token as string) || process.env.SKETCHFAB_OAUTH_TOKEN;

    if (!token) {
      return res.status(401).json({
        error: 'Authentication Required',
        message: 'A Sketchfab OAuth or API token is required to generate direct model download links.'
      });
    }

    try {
      const dlRes = await fetchWithSketchfabAuth(`https://api.sketchfab.com/v3/models/${uid}/download`, token, {
        headers: { 'Accept': 'application/json' }
      });

      if (!dlRes.ok) {
        const errData = await dlRes.json().catch(() => ({}));
        return res.status(dlRes.status).json(errData);
      }

      const dlData = await dlRes.json();
      return res.json(dlData);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // Vite development or production static files setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
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
        Object.keys(prim.attributes).forEach(attr => {
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

  const hasScaleTransformations = gltf.nodes?.some((n: any) => 
    n.scale && (n.scale[0] !== 1 || n.scale[1] !== 1 || n.scale[2] !== 1)
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
    primitivesCount
  };
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

startServer();
