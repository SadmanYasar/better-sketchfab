import {
  AlertCircle,
  Box,
  Check,
  CheckCircle2,
  Cpu,
  Download,
  ExternalLink,
  Eye,
  Heart,
  RefreshCw,
  Triangle,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs';
import type { AdvancedModelMetadata, SketchfabModel } from '../types';

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
  onOpenTokenModal,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'shaders' | 'rigging' | 'download'>(
    'overview',
  );
  const [metadata, setMetadata] = useState<AdvancedModelMetadata | null>(null);
  const [_loadingMetadata, setLoadingMetadata] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [_showIframe] = useState(true);

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
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(`/api/sketchfab/metadata/${model.uid}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setMetadata(data);
        }
      } catch (err) {
        console.warn('Failed to fetch model metadata:', err);
      } finally {
        setLoadingMetadata(false);
      }
    };

    fetchDeepMetadata();
  }, [model, token]);

  if (!model) return null;

  const formattedFaces = model.faceCount.toLocaleString();
  const formattedVertices = model.vertexCount.toLocaleString();
  const embedUrl = `https://sketchfab.com/models/${model.uid}/embed?autostart=1&internal=1&tracking=0&ui_infos=0&ui_snapshots=1&ui_stop=0&ui_watermark=0`;

  const handleDownloadModel = async () => {
    if (!token) {
      onOpenTokenModal();
      return;
    }

    setDownloading(true);
    setDownloadError('');

    try {
      const res = await fetch(`/api/sketchfab/download/${model.uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setDownloadError(
          errData.detail ||
            errData.message ||
            'Download authorization failed. Make sure your Sketchfab token has download access.',
        );
        return;
      }

      const dlData = await res.json();
      const directUrl =
        dlData.gltf?.url || dlData.source?.url || dlData.usdz?.url || dlData.glb?.url;

      if (directUrl) {
        window.open(directUrl, '_blank');
      } else {
        setDownloadError('No direct download link returned by Sketchfab API.');
      }
    } catch (err: any) {
      setDownloadError(err.message || 'Download request error.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={Boolean(model)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-5xl w-[95vw] max-h-[90vh] bg-popover border-border text-popover-foreground p-0 rounded-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-muted/60 flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3 min-w-0 pr-8">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-md">
              <Box className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base sm:text-lg font-bold text-white line-clamp-1">
                  {model.name}
                </DialogTitle>
                {metadata?.isVerifiedGltf && (
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] uppercase shrink-0 font-mono gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified S3 GLTF</span>
                  </Badge>
                )}
              </div>
              <DialogDescription className="text-xs text-zinc-400 font-mono flex items-center gap-2 mt-0.5">
                <span>UID: {model.uid}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-500 shrink-0" />
                <span>By {model.user?.displayName || model.user?.username}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Main Content Area */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Left Side: 3D Embed Viewer */}
          <div className="lg:col-span-7 bg-muted/30 flex flex-col justify-between p-4 space-y-3">
            <div className="relative w-full aspect-video sm:aspect-square lg:aspect-auto lg:h-[440px] bg-background rounded-xl overflow-hidden border border-border shadow-inner">
              <iframe
                title={model.name}
                src={embedUrl}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen; xr-spatial-tracking"
                allowFullScreen
              />
            </div>

            {/* Viewer Controls & License Summary */}
            <div className="bg-card border border-border rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Eye className="w-3.5 h-3.5 text-primary" />
                  <strong className="text-foreground font-mono">
                    {model.viewCount.toLocaleString()}
                  </strong>{' '}
                  views
                </span>
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <strong className="text-zinc-200 font-mono">
                    {model.likeCount.toLocaleString()}
                  </strong>{' '}
                  likes
                </span>
              </div>

              <Badge
                variant="outline"
                className="bg-emerald-950/60 text-emerald-300 border-emerald-800/60 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1"
              >
                <Check className="w-3 h-3 text-emerald-400" />
                <span>{model.license?.label || 'CC Attribution'}</span>
              </Badge>
            </div>
          </div>

          {/* Right Side: Technical Geometry & Shading Tabs */}
          <div className="lg:col-span-5 bg-card p-4 sm:p-5 flex flex-col justify-between gap-4 overflow-y-auto">
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as any)}
              className="w-full flex flex-col gap-3"
            >
              <TabsList className="w-full h-10 grid grid-cols-4 bg-muted border border-border p-1 rounded-xl shrink-0">
                <TabsTrigger
                  value="overview"
                  className="text-xs font-medium py-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                >
                  Geometry
                </TabsTrigger>
                <TabsTrigger
                  value="shaders"
                  className="text-xs font-medium py-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                >
                  Shaders
                </TabsTrigger>
                <TabsTrigger
                  value="rigging"
                  className="text-xs font-medium py-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                >
                  Rigging
                </TabsTrigger>
                <TabsTrigger
                  value="download"
                  className="text-xs font-medium py-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                >
                  Download
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 pt-2 mt-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/40 border border-border p-3 rounded-xl flex flex-col justify-center">
                    <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider block">
                      Triangles
                    </span>
                    <span className="text-base sm:text-lg font-bold font-mono text-primary mt-0.5 flex items-center gap-1.5">
                      <Triangle className="w-4 h-4 fill-primary" />
                      {formattedFaces}
                    </span>
                  </div>
                  <div className="bg-muted/40 border border-border p-3 rounded-xl flex flex-col justify-center">
                    <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider block">
                      Vertices
                    </span>
                    <span className="text-base sm:text-lg font-bold font-mono text-foreground mt-0.5">
                      {formattedVertices}
                    </span>
                  </div>
                  <div className="bg-muted/40 border border-border p-3 rounded-xl flex flex-col justify-center">
                    <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider block">
                      Materials
                    </span>
                    <span className="text-base sm:text-lg font-bold font-mono text-foreground mt-0.5">
                      {model.materialCount || 1}
                    </span>
                  </div>
                  <div className="bg-muted/40 border border-border p-3 rounded-xl flex flex-col justify-center">
                    <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider block">
                      Textures
                    </span>
                    <span className="text-base sm:text-lg font-bold font-mono text-foreground mt-0.5">
                      {model.textureCount || 0}
                    </span>
                  </div>
                </div>

                {metadata?.advanced && (
                  <div className="bg-muted/40 border border-border p-3.5 rounded-xl space-y-2 text-xs">
                    <h4 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-primary" />
                      Manifest Scene Breakdown
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-muted-foreground font-mono text-[11px]">
                      <div>
                        Nodes:{' '}
                        <strong className="text-foreground">{metadata.advanced.nodesCount}</strong>
                      </div>
                      <div>
                        Meshes:{' '}
                        <strong className="text-foreground">{metadata.advanced.meshesCount}</strong>
                      </div>
                      <div>
                        Primitives:{' '}
                        <strong className="text-foreground">
                          {metadata.advanced.primitivesCount}
                        </strong>
                      </div>
                      <div>
                        UV Layers:{' '}
                        <strong className="text-foreground">
                          {metadata.advanced.uvLayersCount}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="shaders" className="space-y-4 pt-4">
                <div className="bg-muted/40 border border-border p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">PBR Workflow</span>
                    <Badge
                      variant="outline"
                      className="bg-primary/10 text-primary border-primary/30 text-xs"
                    >
                      {model.isPbr ? 'pbrMetallicRoughness' : 'Standard Phong'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">UV Coordinates</span>
                    <span className="text-foreground font-mono">
                      Present ({metadata?.advanced.uvLayersCount || 1} Set)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Vertex Colors</span>
                    <span className="text-foreground font-mono">
                      {metadata?.advanced.hasVertexColors ? 'Included' : 'None'}
                    </span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="rigging" className="space-y-4 pt-4">
                <div className="bg-[#09090b] border border-zinc-800/80 p-4 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Skeletal Rigging</span>
                    <Badge
                      variant="outline"
                      className={
                        metadata?.advanced.isRigged
                          ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }
                    >
                      {metadata?.advanced.isRigged ? 'Rigged Skeleton' : 'Unrigged Mesh'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Animation Tracks</span>
                    <span className="font-mono text-zinc-200">
                      {model.animationCount || 0} Clips
                    </span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="download" className="space-y-4 pt-4">
                <div className="bg-[#09090b] border border-zinc-800/80 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Estimated ZIP Size</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {metadata?.basic.downloadSizeFormatted || '15 MB'}
                    </span>
                  </div>

                  <Button
                    onClick={handleDownloadModel}
                    disabled={downloading}
                    className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 gap-2"
                  >
                    {downloading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>
                      {token ? 'Download 3D Model Archive' : 'Authenticate Token to Download'}
                    </span>
                  </Button>

                  {downloadError && (
                    <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <p>{downloadError}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Direct Sketchfab Page Link */}
            <a
              href={model.viewerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-9 bg-[#09090b] border border-zinc-800 text-zinc-300 hover:text-white text-xs gap-1.5 rounded-xl inline-flex items-center justify-center font-medium transition-colors"
            >
              <span>View on Sketchfab.com</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
