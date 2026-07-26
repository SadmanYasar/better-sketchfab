import React from 'react';
import { Heart, Eye, Download, Layers, Box, Sparkles, ChevronRight, Check } from 'lucide-react';
import { SketchfabModel } from '../types';

interface ModelCardProps {
  model: SketchfabModel;
  onSelectModel: (model: SketchfabModel) => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({ model, onSelectModel }) => {
  // Extract highest resolution thumbnail (sort by width descending)
  const getHighestResThumbnail = () => {
    const images = model.thumbnails?.images;
    if (!images || images.length === 0) {
      return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800';
    }
    const sorted = [...images].sort((a, b) => (b.width || 0) - (a.width || 0));
    return sorted[0]?.url || images[0]?.url;
  };

  const thumbnail = getHighestResThumbnail();

  const formattedFaces = model.faceCount >= 1000 
    ? `${(model.faceCount / 1000).toFixed(1)}k` 
    : model.faceCount.toString();

  const formattedVertices = model.vertexCount >= 1000 
    ? `${(model.vertexCount / 1000).toFixed(1)}k` 
    : model.vertexCount.toString();

  const isLowPoly = model.faceCount < 20000;

  return (
    <div
      onClick={() => onSelectModel(model)}
      className="group bg-[#111113] border border-zinc-800/90 hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer flex flex-col justify-between"
    >
      {/* Thumbnail Header */}
      <div className="relative aspect-video bg-[#0A0A0B] overflow-hidden">
        <img
          src={thumbnail}
          alt={model.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/20 to-transparent opacity-85 group-hover:opacity-65 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 z-10">
          {model.isPbr && (
            <span className="bg-indigo-950/90 text-indigo-300 border border-indigo-700/60 text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md">
              PBR
            </span>
          )}
          {(model.animationCount || 0) > 0 && (
            <span className="bg-amber-950/90 text-amber-300 border border-amber-700/60 text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
              {model.animationCount} Anim
            </span>
          )}
          {isLowPoly && (
            <span className="bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md">
              Low Poly
            </span>
          )}
        </div>

        {/* Download Badge */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className="bg-[#111113]/90 text-zinc-200 border border-zinc-700/80 text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-md flex items-center gap-1">
            <Download className="w-2.5 h-2.5 text-indigo-400" />
            Free 3D
          </span>
        </div>

        {/* Geometry Metrics Overlay at Bottom of Thumbnail */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs z-10">
          <div className="flex items-center gap-2">
            <span className="bg-[#0A0A0B]/90 border border-zinc-800 text-zinc-200 text-[11px] font-mono font-medium px-2 py-0.5 rounded-md backdrop-blur-md flex items-center gap-1">
              <span className="text-indigo-400 font-bold">△</span> {formattedFaces}
            </span>
            <span className="bg-[#0A0A0B]/90 border border-zinc-800 text-zinc-300 text-[11px] font-mono font-medium px-2 py-0.5 rounded-md backdrop-blur-md flex items-center gap-1">
              <span className="text-sky-400">•</span> {formattedVertices}
            </span>
          </div>
          {model.materialCount && (
            <span className="bg-[#0A0A0B]/90 border border-zinc-800 text-zinc-400 text-[10px] font-mono px-2 py-0.5 rounded-md backdrop-blur-md">
              {model.materialCount} Mat
            </span>
          )}
        </div>
      </div>

      {/* Model Info Section */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <h3 className="font-semibold text-zinc-100 text-sm line-clamp-1 group-hover:text-indigo-400 transition-colors">
            {model.name}
          </h3>
          
          {/* Author */}
          <div className="flex items-center gap-2 mt-2">
            {model.user?.avatar?.images?.[0]?.url ? (
              <img
                src={model.user.avatar.images[0].url}
                alt={model.user.username}
                referrerPolicy="no-referrer"
                className="w-5 h-5 rounded-full object-cover border border-zinc-700"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-300 font-bold">
                {model.user?.username?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            )}
            <span className="text-xs text-zinc-400 line-clamp-1 hover:text-zinc-200">
              {model.user?.displayName || model.user?.username || 'Sketchfab Creator'}
            </span>
          </div>
        </div>

        {/* Footer Metrics & Inspect Button */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="flex items-center gap-1 hover:text-zinc-200">
              <Eye className="w-3.5 h-3.5 text-zinc-500" />
              {model.viewCount >= 1000 ? `${(model.viewCount / 1000).toFixed(1)}k` : model.viewCount}
            </span>
            <span className="flex items-center gap-1 hover:text-zinc-200">
              <Heart className="w-3.5 h-3.5 text-rose-500/80" />
              {model.likeCount >= 1000 ? `${(model.likeCount / 1000).toFixed(1)}k` : model.likeCount}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectModel(model);
            }}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/20 transition-all"
          >
            <span>Inspect</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
