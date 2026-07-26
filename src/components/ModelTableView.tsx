import React from 'react';
import { Layers, Sparkles, Check, X, ChevronRight, Eye, Heart, Download } from 'lucide-react';
import { SketchfabModel } from '../types';

interface ModelTableViewProps {
  models: SketchfabModel[];
  onSelectModel: (model: SketchfabModel) => void;
}

export const ModelTableView: React.FC<ModelTableViewProps> = ({ models, onSelectModel }) => {
  return (
    <div className="bg-[#111113] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-[#0A0A0B] border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3">Triangles (△)</th>
              <th className="px-4 py-3">Vertices (•)</th>
              <th className="px-4 py-3">PBR Shaders</th>
              <th className="px-4 py-3">Materials</th>
              <th className="px-4 py-3">Textures</th>
              <th className="px-4 py-3">Animations</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {models.map((model) => {
              const images = model.thumbnails?.images;
              const sortedThumbnails = images && images.length > 0 
                ? [...images].sort((a, b) => (b.width || 0) - (a.width || 0))
                : [];
              const thumbnail =
                sortedThumbnails[0]?.url ||
                model.thumbnails?.images?.[0]?.url ||
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150';

              return (
                <tr
                  key={model.uid}
                  onClick={() => onSelectModel(model)}
                  className="hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                >
                  {/* Model Thumbnail & Title */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={thumbnail}
                        alt={model.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-10 object-cover rounded-lg border border-zinc-700/80 shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div>
                        <span className="font-semibold text-zinc-100 group-hover:text-indigo-400 transition-colors line-clamp-1">
                          {model.name}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-0.5">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3 text-zinc-400" />
                            {model.viewCount >= 1000 ? `${(model.viewCount / 1000).toFixed(1)}k` : model.viewCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-rose-400" />
                            {model.likeCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Triangles */}
                  <td className="px-4 py-3 font-mono font-medium text-zinc-200">
                    <span className="text-indigo-400 font-bold mr-1">△</span>
                    {model.faceCount.toLocaleString()}
                  </td>

                  {/* Vertices */}
                  <td className="px-4 py-3 font-mono font-medium text-zinc-300">
                    <span className="text-sky-400 font-bold mr-1">•</span>
                    {model.vertexCount.toLocaleString()}
                  </td>

                  {/* PBR */}
                  <td className="px-4 py-3">
                    {model.isPbr ? (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-950/60 text-indigo-300 border border-indigo-700/50 px-2 py-0.5 rounded-md font-semibold">
                        <Check className="w-3 h-3 text-indigo-400" />
                        PBR Ready
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-[10px]">Standard</span>
                    )}
                  </td>

                  {/* Materials */}
                  <td className="px-4 py-3 font-mono text-zinc-300">
                    {model.materialCount || 1}
                  </td>

                  {/* Textures */}
                  <td className="px-4 py-3 font-mono text-zinc-300">
                    {model.textureCount || 0}
                  </td>

                  {/* Animations */}
                  <td className="px-4 py-3">
                    {(model.animationCount || 0) > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-amber-950/60 text-amber-300 border border-amber-700/50 px-2 py-0.5 rounded-md font-semibold">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        {model.animationCount} Clips
                      </span>
                    ) : (
                      <span className="text-zinc-600 text-[10px]">Static</span>
                    )}
                  </td>

                  {/* Author */}
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {model.user?.displayName || model.user?.username || 'Creator'}
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectModel(model);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-semibold inline-flex items-center gap-1 transition-all"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
