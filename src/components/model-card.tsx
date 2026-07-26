import { ChevronRight, Download, Eye, Heart, Sparkles, Triangle } from 'lucide-react';
import type React from 'react';
import { useCallback, useRef, useState } from 'react';
import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import { fetchModelSpritesheet } from '../lib/sketchfabServerFns';
import type { SketchfabModel } from '../types';

interface ModelCardProps {
  model: SketchfabModel;
  onSelectModel: (model: SketchfabModel) => void;
}

function getHighestResThumbnail(model: SketchfabModel): string {
  const images = model.thumbnails?.images;
  if (!images || images.length === 0) {
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800';
  }
  const sorted = [...images].sort((a, b) => (b.width || 0) - (a.width || 0));
  return sorted[0]?.url || images[0]?.url;
}

const SPRITE_FRAME_COUNT = 15;

interface SpriteInfo {
  url: string;
  naturalWidth: number;
  naturalHeight: number;
}

export const ModelCard: React.FC<ModelCardProps> = ({ model, onSelectModel }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const spriteCache = useRef<Map<string, SpriteInfo>>(new Map());
  const spriteRef = useRef<SpriteInfo | null>(null);
  const [sprite, setSprite] = useState<SpriteInfo | null>(null);
  const [offsetPx, setOffsetPx] = useState(0);

  const handleMouseEnter = useCallback(() => {
    const cached = spriteCache.current.get(model.uid);
    if (cached) {
      spriteRef.current = cached;
      setSprite(cached);
      setOffsetPx(0);
      return;
    }
    fetchModelSpritesheet({ data: { uid: model.uid } }).then((result) => {
      if (!result.url) return;
      const preload = new Image();
      preload.onload = () => {
        const info: SpriteInfo = {
          url: result.url,
          naturalWidth: preload.naturalWidth,
          naturalHeight: preload.naturalHeight,
        };
        spriteCache.current.set(model.uid, info);
        spriteRef.current = info;
        setSprite(info);
        setOffsetPx(0);
      };
      preload.src = result.url;
    });
  }, [model.uid]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    const info = spriteRef.current;
    if (!card || !info) return;
    const rect = card.getBoundingClientRect();
    const w = rect.width;
    const x = (e.clientX - rect.left) / w;
    const index = Math.min(Math.floor(x * SPRITE_FRAME_COUNT), SPRITE_FRAME_COUNT - 1);
    const bgW = info.naturalWidth * (w / info.naturalHeight);
    const shift = (index + 0.5) * (bgW / SPRITE_FRAME_COUNT) - w / 2;
    setOffsetPx(-shift);
  }, []);

  const handleMouseLeave = useCallback(() => {
    spriteRef.current = null;
    setSprite(null);
    setOffsetPx(0);
  }, []);

  const thumbnail = getHighestResThumbnail(model);

  const formattedFaces =
    model.faceCount >= 1000
      ? `${(model.faceCount / 1000).toFixed(1)}k`
      : model.faceCount.toString();

  const formattedVertices =
    model.vertexCount >= 1000
      ? `${(model.vertexCount / 1000).toFixed(1)}k`
      : model.vertexCount.toString();

  const isLowPoly = model.faceCount < 20000;

  return (
    <div
      ref={cardRef}
      onClick={() => onSelectModel(model)}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 bg-muted"
    >
      {/* Spritesheet or static thumbnail */}
      {sprite ? (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${sprite.url})`,
            backgroundSize: 'auto 100%',
            backgroundPosition: `${offsetPx}px 0`,
            backgroundRepeat: 'no-repeat',
          }}
        />
      ) : (
        <img
          src={thumbnail}
          alt={model.name}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Dark gradient overlay — heavier at bottom for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10 group-hover:from-black/75 transition-all duration-300" />

      {/* ── Top badges ── */}
      <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1 z-10">
        {model.isPbr && (
          <Badge
            variant="default"
            className="text-[10px] font-bold px-1.5 py-0 rounded-md backdrop-blur-md"
          >
            PBR
          </Badge>
        )}
        {(model.animationCount || 0) > 0 && (
          <Badge
            variant="secondary"
            className="text-[10px] font-bold px-1.5 py-0 rounded-md backdrop-blur-md flex items-center gap-0.5"
          >
            <Sparkles className="w-2.5 h-2.5" />
            <span>{model.animationCount}</span>
          </Badge>
        )}
        {isLowPoly && (
          <Badge
            variant="secondary"
            className="text-[10px] font-bold px-1.5 py-0 rounded-md backdrop-blur-md"
          >
            Low Poly
          </Badge>
        )}
      </div>

      {/* Free Download badge — top right */}
      <div className="absolute top-2.5 right-2.5 z-10">
        <Badge
          variant="outline"
          className="bg-black/50 text-white border-white/20 text-[10px] font-semibold px-1.5 py-0 rounded-md backdrop-blur-md flex items-center gap-1"
        >
          <Download className="w-2.5 h-2.5 text-primary" />
          <span>Free</span>
        </Badge>
      </div>

      {/* ── Bottom info panel ── */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-10 space-y-2">
        {/* Geometry stats row */}
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="bg-black/60 border-white/15 text-white text-[10px] font-mono font-medium px-1.5 py-0 rounded-md backdrop-blur-md flex items-center gap-1"
          >
            <Triangle className="w-2.5 h-2.5 text-primary fill-primary" />
            <span>{formattedFaces}</span>
          </Badge>
          <Badge
            variant="outline"
            className="bg-black/60 border-white/15 text-white text-[10px] font-mono font-medium px-1.5 py-0 rounded-md backdrop-blur-md flex items-center gap-1"
          >
            <span className="w-1 h-1 rounded-full bg-white/50 shrink-0" />
            <span>{formattedVertices}</span>
          </Badge>
          {model.materialCount && (
            <Badge
              variant="outline"
              className="bg-black/60 border-white/15 text-white/80 text-[10px] font-mono px-1.5 py-0 rounded-md backdrop-blur-md"
            >
              {model.materialCount}m
            </Badge>
          )}
        </div>

        {/* Model name */}
        <h3 className="font-semibold text-white text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors drop-shadow-sm">
          {model.name}
        </h3>

        {/* Author + stats + inspect button row */}
        <div className="flex items-center justify-between gap-2">
          {/* Author */}
          <div className="flex items-center gap-1.5 min-w-0">
            {model.user?.avatar?.images?.[0]?.url ? (
              <img
                src={model.user.avatar.images[0].url}
                alt={model.user.username}
                referrerPolicy="no-referrer"
                className="w-4 h-4 rounded-full object-cover border border-white/20 shrink-0"
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-white/20 border border-white/20 flex items-center justify-center text-[9px] text-white font-bold shrink-0">
                {model.user?.username?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            )}
            <span className="text-[11px] text-white/70 line-clamp-1 truncate">
              {model.user?.displayName || model.user?.username || 'Creator'}
            </span>
          </div>

          {/* View / Like + Inspect */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="flex items-center gap-0.5 text-[10px] text-white/60 font-mono">
              <Eye className="w-3 h-3" />
              {model.viewCount >= 1000
                ? `${(model.viewCount / 1000).toFixed(1)}k`
                : model.viewCount}
            </span>
            <span className="flex items-center gap-0.5 text-[10px] text-white/60 font-mono">
              <Heart className="w-3 h-3 text-red-400" />
              {model.likeCount >= 1000
                ? `${(model.likeCount / 1000).toFixed(1)}k`
                : model.likeCount}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSelectModel(model);
              }}
              className="h-6 text-[10px] font-semibold px-2 rounded-lg gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm"
            >
              <span>Inspect</span>
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
