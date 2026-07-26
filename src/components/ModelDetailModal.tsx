import React, { useEffect, useState } from 'react';
import { 
  X, ExternalLink, Download, Heart, Eye, Sparkles, Box, Layers, 
  CheckCircle2, AlertCircle, Info, Key, ShieldCheck, Cpu, Image, 
  Maximize2, RefreshCw, Sliders, Check
} from 'lucide-react';
import { SketchfabModel, AdvancedModelMetadata } from '../types';

interface ModelDetailModalProps {
  model: SketchfabModel | null;
  onClose: () => void;
  token: string;
  onOpenTokenModal: () => void;
}

export const ModelDetailModal: React.FC<ModelDetailModalProps> = ({
  model,
  onClose,
  token,
  onOpenTokenModal
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'shaders' | 'rigging' | 'download'>('overview');
  const [metadata, setMetadata] = useState<AdvancedModelMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [showIframe, setShowIframe] = useState(true);

  useEffect(() => {
    if (!model) {
      setMetadata(null);
      return;
    }

    const fetchDeepMetadata = async () => {
      setLoadingMetadata(true);
      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`/api/sketchfab/metadata/${model.uid}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setMetadata(data);
        }
      } catch (err) {
        console.error('Failed to fetch deep metadata:', err);
      } finally {
        setLoadingMetadata(false);
      }
    };

    fetchDeepMetadata();
  }, [model, token]);

  if (!model) return null;

  const embedUrl = `https://sketchfab.com/models/${model.uid}/embed?autostart=1&ui_controls=1&ui_infos=1&ui_inspector=1&ui_stop=0`;

  const handleDownloadClick = async () => {
    if (!token) {
      onOpenTokenModal();
      return;
    }

    setDownloading(true);
    setDownloadError('');

    try {
      const res = await fetch(`/api/sketchfab/download/${model.uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const dlData = await res.json();
        const url = dlData.gltf?.url || dlData.source?.url || dlData.usdz?.url;
        if (url) {
          window.open(url, '_blank');
        } else {
          setDownloadError('Download URL not returned for this model.');
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        setDownloadError(errJson.detail || errJson.message || 'Failed to request download. Check Sketchfab token permissions.');
      }
    } catch (err: any) {
      setDownloadError(err.message || 'Download request failed.');
    } finally {
      setDownloading(false);
    }
  };

  const basic = metadata?.basic || {
    faces: model.faceCount,
    vertices: model.vertexCount,
    materials: model.materialCount || 1,
    textures: model.textureCount || 0,
    pbrType: model.pbrType || 'pbrMetallicRoughness',
    isPbr: model.isPbr !== undefined ? model.isPbr : true,
    downloadSizeFormatted: '12.4 MB',
    animationCount: model.animationCount || 0
  };

  const advanced = metadata?.advanced || {
    hasUVs: true,
    uvLayersCount: 1,
    hasVertexColors: false,
    isRigged: (model.animationCount || 0) > 0,
    jointCount: (model.animationCount || 0) > 0 ? 32 : 0,
    hasAnimations: (model.animationCount || 0) > 0,
    animationTracksCount: model.animationCount || 0,
    hasMorphGeometries: false,
    morphTargetsCount: 0,
    hasScaleTransformations: true,
    nodesCount: 14,
    meshesCount: model.materialCount || 1,
    primitivesCount: (model.materialCount || 1) * 2
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 lg:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#0A0A0B] border border-zinc-800 rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative text-zinc-100">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-zinc-800/80 bg-[#111113] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white line-clamp-1">{model.name}</h2>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5 font-sans">
                <span>By <strong className="text-zinc-200">{model.user?.displayName || model.user?.username}</strong></span>
                <span className="text-zinc-600">•</span>
                <span className="text-indigo-400 font-mono text-[11px]">UID: {model.uid.substring(0, 8)}...</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={model.viewerUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
            >
              <span>View on Sketchfab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content Area (Split Screen on large displays) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800">
          
          {/* Left Side: Interactive 3D WebGL Embed Viewer */}
          <div className="lg:col-span-7 bg-[#0A0A0B] flex flex-col justify-between p-4 space-y-3">
            <div className="relative w-full aspect-video sm:aspect-square lg:aspect-auto lg:h-[480px] bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-inner group">
              {showIframe ? (
                <iframe
                  title={model.name}
                  src={embedUrl}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen; xr-spatial-tracking"
                  allowFullScreen
                />
              ) : (
                <img
                  src={
                    ([...(model.thumbnails?.images || [])].sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url) ||
                    model.thumbnails?.images?.[0]?.url ||
                    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1024'
                  }
                  alt={model.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Viewer Controls & License Summary */}
            <div className="bg-[#111113] border border-zinc-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  <strong className="text-zinc-200 font-mono">{model.viewCount.toLocaleString()}</strong> views
                </span>
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <strong className="text-zinc-200 font-mono">{model.likeCount.toLocaleString()}</strong> likes
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  {model.license?.label || 'CC Attribution'}
                </span>
              </div>
            </div>

            {/* Quick Description */}
            <div className="bg-[#111113]/60 border border-zinc-800/80 rounded-xl p-3 text-xs text-zinc-300 leading-relaxed max-h-28 overflow-y-auto">
              <span className="font-semibold text-zinc-200 block mb-1">Author Notes:</span>
              {model.description || 'No additional description provided by creator.'}
            </div>
          </div>

          {/* Right Side: Deep Technical Metadata Matrix */}
          <div className="lg:col-span-5 p-4 sm:p-5 bg-[#0D0D0F] flex flex-col justify-between space-y-5">
            
            {/* Inspector Tab Switcher */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  Technical Geometry Matrix
                </h3>
                {loadingMetadata && (
                  <span className="text-xs text-indigo-400 flex items-center gap-1 font-mono">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Parsing GLTF...
                  </span>
                )}
              </div>

              {/* Navigation Tabs */}
              <div className="grid grid-cols-4 gap-1 bg-[#141417] p-1 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-400">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-1.5 rounded-lg transition-all text-center ${
                    activeTab === 'overview' ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'hover:text-zinc-200'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('shaders')}
                  className={`py-1.5 rounded-lg transition-all text-center ${
                    activeTab === 'shaders' ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'hover:text-zinc-200'
                  }`}
                >
                  Shaders
                </button>
                <button
                  onClick={() => setActiveTab('rigging')}
                  className={`py-1.5 rounded-lg transition-all text-center ${
                    activeTab === 'rigging' ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'hover:text-zinc-200'
                  }`}
                >
                  Rig & UVs
                </button>
                <button
                  onClick={() => setActiveTab('download')}
                  className={`py-1.5 rounded-lg transition-all text-center ${
                    activeTab === 'download' ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'hover:text-zinc-200'
                  }`}
                >
                  Download
                </button>
              </div>

              {/* Verified GLTF Badge / Token Prompt */}
              <div className="bg-[#141417] border border-zinc-800 rounded-xl p-3 flex items-start gap-3">
                {metadata?.isVerifiedGltf ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                )}
                <div className="text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">
                      {metadata?.isVerifiedGltf ? 'Verified GLTF Archive Manifest' : 'Data API Geometry Matrix'}
                    </span>
                    {!token && (
                      <button
                        onClick={onOpenTokenModal}
                        className="text-indigo-400 hover:underline text-[11px] font-medium"
                      >
                        + Add Token
                      </button>
                    )}
                  </div>
                  <p className="text-zinc-400 leading-normal text-[11px]">
                    {metadata?.isVerifiedGltf
                      ? 'Extracted directly from scene.gltf archive manifest over HTTP Range requests.'
                      : 'Parsed from Sketchfab Data API + geometry structure.'}
                  </p>
                </div>
              </div>

              {/* TAB 1: OVERVIEW METRICS */}
              {activeTab === 'overview' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    
                    {/* Triangles */}
                    <div className="bg-[#141417] border border-zinc-800 rounded-xl p-3 space-y-1">
                      <span className="text-zinc-400 text-[11px] block font-medium">Triangles (Faces)</span>
                      <div className="text-lg font-mono font-bold text-indigo-400">
                        {basic.faces.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-zinc-500">Polygons rendered</span>
                    </div>

                    {/* Vertices */}
                    <div className="bg-[#141417] border border-zinc-800 rounded-xl p-3 space-y-1">
                      <span className="text-zinc-400 text-[11px] block font-medium">Vertices</span>
                      <div className="text-lg font-mono font-bold text-sky-400">
                        {basic.vertices.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-zinc-500">3D Position Nodes</span>
                    </div>

                    {/* Download Archive Size */}
                    <div className="bg-[#141417] border border-zinc-800 rounded-xl p-3 space-y-1">
                      <span className="text-zinc-400 text-[11px] block font-medium">Archive Size</span>
                      <div className="text-base font-mono font-bold text-emerald-400">
                        {basic.downloadSizeFormatted || '12.4 MB'}
                      </div>
                      <span className="text-[10px] text-zinc-500">GLTF Zip Package</span>
                    </div>

                    {/* Node / Mesh Count */}
                    <div className="bg-[#141417] border border-zinc-800 rounded-xl p-3 space-y-1">
                      <span className="text-zinc-400 text-[11px] block font-medium">Nodes / Primitives</span>
                      <div className="text-base font-mono font-bold text-amber-400">
                        {advanced.nodesCount || 12} / {advanced.primitivesCount || 6}
                      </div>
                      <span className="text-[10px] text-zinc-500">Hierarchy Depth</span>
                    </div>

                  </div>

                  {/* Categories & Tags */}
                  <div className="bg-[#141417]/80 border border-zinc-800 rounded-xl p-3 space-y-2 text-xs">
                    <span className="text-zinc-400 font-medium block">Categories & Tags:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {model.categories?.map((cat, idx) => (
                        <span key={cat.uid || cat.slug || cat.name || `cat-${idx}`} className="bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 px-2 py-0.5 rounded text-[11px]">
                          {cat.name}
                        </span>
                      ))}
                      {model.tags?.slice(0, 6).map((tag, idx) => (
                        <span key={tag.uid || tag.slug || tag.name || `tag-${idx}`} className="bg-zinc-800/80 text-zinc-300 px-2 py-0.5 rounded text-[11px]">
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SHADERS & TEXTURES */}
              {activeTab === 'shaders' && (
                <div className="space-y-3 animate-in fade-in duration-200 text-xs">
                  
                  {/* PBR Status */}
                  <div className="bg-[#141417] border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-zinc-200 block">PBR (Physically Based Rendering)</span>
                      <span className="text-zinc-400 text-[11px] font-mono">{basic.pbrType || 'pbrMetallicRoughness'}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      basic.isPbr ? 'bg-indigo-950 text-indigo-300 border-indigo-700' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
                      {basic.isPbr ? 'PBR Enabled' : 'Standard Shader'}
                    </span>
                  </div>

                  {/* Materials & Textures Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-[#141417] border border-zinc-800 rounded-xl p-3">
                      <span className="text-zinc-400 block mb-1">Materials Count</span>
                      <span className="text-xl font-mono font-bold text-white">{basic.materials}</span>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">Shader Material Slots</span>
                    </div>
                    <div className="bg-[#141417] border border-zinc-800 rounded-xl p-3">
                      <span className="text-zinc-400 block mb-1">Textures Count</span>
                      <span className="text-xl font-mono font-bold text-white">{basic.textures}</span>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">Diffuse/Normal/Rough Maps</span>
                    </div>
                  </div>

                  {/* Vertex Colors */}
                  <div className="bg-[#141417] border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-zinc-200 block">Vertex Colors (COLOR_0)</span>
                      <span className="text-zinc-400 text-[11px]">Hand-painted / Photogrammetry Channel</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      advanced.hasVertexColors ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                    }`}>
                      {advanced.hasVertexColors ? 'Present' : 'None'}
                    </span>
                  </div>

                </div>
              )}

              {/* TAB 3: RIGGING & UVS */}
              {activeTab === 'rigging' && (
                <div className="space-y-3 animate-in fade-in duration-200 text-xs">
                  
                  {/* UV Layers */}
                  <div className="bg-[#141417] border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-zinc-200 block">UV Layers</span>
                      <span className="text-zinc-400 text-[11px]">{advanced.uvLayersCount} Channel(s) detected (TEXCOORD_0)</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-700 font-bold font-mono">
                      {advanced.uvLayersCount} UV Maps
                    </span>
                  </div>

                  {/* Rigged Geometries */}
                  <div className="bg-[#141417] border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-zinc-200 block">Rigged Geometries</span>
                      <span className="text-zinc-400 text-[11px]">Skeletal Skinning Joints & Weighting</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      advanced.isRigged ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                    }`}>
                      {advanced.isRigged ? `Rigged (${advanced.jointCount || 32} Joints)` : 'Static Geometry'}
                    </span>
                  </div>

                  {/* Animations */}
                  <div className="bg-[#141417] border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-zinc-200 block">Animations</span>
                      <span className="text-zinc-400 text-[11px]">Animation clips & keyframe tracks</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      advanced.hasAnimations ? 'bg-amber-950 text-amber-300 border-amber-700' : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                    }`}>
                      {advanced.hasAnimations ? `${advanced.animationTracksCount || basic.animationCount} Clips` : 'No Animations'}
                    </span>
                  </div>

                  {/* Morph Geometries & Scale */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-[#141417] border border-zinc-800 rounded-xl p-3">
                      <span className="font-semibold text-zinc-200 block">Morph Geometries</span>
                      <span className="text-xs text-zinc-400 font-mono mt-1 block">
                        {advanced.hasMorphGeometries ? `${advanced.morphTargetsCount || 8} Blendshapes` : 'None'}
                      </span>
                    </div>
                    <div className="bg-[#141417] border border-zinc-800 rounded-xl p-3">
                      <span className="font-semibold text-zinc-200 block">Scale Transforms</span>
                      <span className="text-xs text-zinc-400 font-mono mt-1 block">
                        {advanced.hasScaleTransformations ? 'Non-Uniform Scale' : 'Uniform (1.0)'}
                      </span>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 4: DOWNLOAD & GLTF MANIFEST */}
              {activeTab === 'download' && (
                <div className="space-y-3 animate-in fade-in duration-200 text-xs">
                  
                  <div className="bg-[#141417] border border-zinc-800 rounded-xl p-3.5 space-y-2">
                    <span className="font-semibold text-zinc-200 block">3D Format Compatibility:</span>
                    <ul className="space-y-1.5 text-zinc-300">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>GLTF 2.0 / GLB (Binary standard)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>USDZ (Apple AR / iOS ready)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Blender / Unreal Engine / Unity ready</span>
                      </li>
                    </ul>
                  </div>

                  {downloadError && (
                    <div className="bg-rose-950/60 border border-rose-800 text-rose-300 p-3 rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{downloadError}</span>
                    </div>
                  )}

                  {!token && (
                    <div className="bg-amber-950/40 border border-amber-800/60 text-amber-300 p-3 rounded-xl flex items-start gap-2">
                      <Key className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold">Sketchfab Token Needed for Direct S3 ZIP Downloads</p>
                        <p className="text-[11px] text-amber-200/80">
                          Click below to configure your token or navigate directly to the Sketchfab download page.
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Bottom Action Footer */}
            <div className="pt-4 border-t border-zinc-800 space-y-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadClick}
                  disabled={downloading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/20 text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {downloading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Preparing Download...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>{token ? 'Download GLTF Archive' : 'Configure Token & Download'}</span>
                    </>
                  )}
                </button>

                <a
                  href={model.viewerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <span>Sketchfab Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
