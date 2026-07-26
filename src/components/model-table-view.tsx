import { Check, ChevronRight, Eye, Heart, Sparkles, Triangle } from 'lucide-react';
import type React from 'react';
import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import type { SketchfabModel } from '../types';

interface ModelTableViewProps {
  models: SketchfabModel[];
  onSelectModel: (model: SketchfabModel) => void;
}

export const ModelTableView: React.FC<ModelTableViewProps> = ({ models, onSelectModel }) => {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-foreground">
          <thead className="bg-muted border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3">Triangles</th>
              <th className="px-4 py-3">Vertices</th>
              <th className="px-4 py-3">PBR Shaders</th>
              <th className="px-4 py-3">Materials</th>
              <th className="px-4 py-3">Textures</th>
              <th className="px-4 py-3">Animations</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {models.map((model) => {
              const images = model.thumbnails?.images;
              const sortedThumbnails =
                images && images.length > 0
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
                  className="hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  {/* Model Thumbnail & Title */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={thumbnail}
                        alt={model.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-10 object-cover rounded-lg border border-border shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div>
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {model.name}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono mt-0.5">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3 text-muted-foreground" />
                            <span>
                              {model.viewCount >= 1000
                                ? `${(model.viewCount / 1000).toFixed(1)}k`
                                : model.viewCount}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-destructive" />
                            <span>{model.likeCount}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Triangles */}
                  <td className="px-4 py-3 font-mono font-medium text-foreground">
                    <Triangle className="w-3 h-3 text-primary fill-primary inline-block mr-1 align-middle" />
                    <span className="align-middle">{model.faceCount.toLocaleString()}</span>
                  </td>

                  {/* Vertices */}
                  <td className="px-4 py-3 font-mono font-medium text-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground inline-block mr-1.5 align-middle" />
                    <span className="align-middle">{model.vertexCount.toLocaleString()}</span>
                  </td>

                  {/* PBR */}
                  <td className="px-4 py-3">
                    {model.isPbr ? (
                      <Badge
                        variant="default"
                        className="text-[10px] px-2 py-0.5 rounded-md font-semibold gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>PBR Ready</span>
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-[10px]">Standard</span>
                    )}
                  </td>

                  {/* Materials */}
                  <td className="px-4 py-3 font-mono text-foreground">
                    {model.materialCount || 1}
                  </td>

                  {/* Textures */}
                  <td className="px-4 py-3 font-mono text-foreground">{model.textureCount || 0}</td>

                  {/* Animations */}
                  <td className="px-4 py-3">
                    {(model.animationCount || 0) > 0 ? (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-2 py-0.5 rounded-md font-semibold gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{model.animationCount} Clips</span>
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-[10px]">Static</span>
                    )}
                  </td>

                  {/* Author */}
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {model.user?.displayName || model.user?.username || 'Creator'}
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectModel(model);
                      }}
                      className="h-7 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-all"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
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
