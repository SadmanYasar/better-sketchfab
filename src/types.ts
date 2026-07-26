export interface SketchfabUser {
  uid: string;
  username: string;
  displayName: string;
  profileUrl: string;
  avatar: {
    images: { url: string; width: number; height: number }[];
  };
}

export interface SketchfabImage {
  url: string;
  width: number;
  height: number;
  size?: number;
}

export interface SketchfabModel {
  uid: string;
  name: string;
  description: string;
  viewerUrl: string;
  embedUrl: string;
  faceCount: number;
  vertexCount: number;
  materialCount?: number;
  textureCount?: number;
  animationCount?: number;
  soundCount?: number;
  isPbr?: boolean;
  pbrType?: string;
  isDownloadable: boolean;
  publishedAt: string;
  updatedAt?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  downloadCount?: number;
  categories: { uid: string; name: string; slug: string }[];
  tags: { uid: string; name: string; slug: string }[];
  license?: {
    uid: string;
    code: string;
    label: string;
    requirements?: string;
  };
  user: SketchfabUser;
  thumbnails: {
    images: SketchfabImage[];
  };
}

export interface AdvancedModelMetadata {
  isVerifiedGltf: boolean;
  basic: {
    faces: number;
    vertices: number;
    materials: number;
    textures: number;
    pbrType: string;
    isPbr: boolean;
    downloadSize?: number; // bytes
    downloadSizeFormatted?: string;
    animationCount: number;
  };
  advanced: {
    hasUVs: boolean;
    uvLayersCount: number;
    hasVertexColors: boolean;
    isRigged: boolean;
    jointCount?: number;
    hasAnimations: boolean;
    animationTracksCount?: number;
    hasMorphGeometries: boolean;
    morphTargetsCount?: number;
    hasScaleTransformations: boolean;
    nodesCount?: number;
    meshesCount?: number;
    primitivesCount?: number;
  };
  gltfRawStats?: {
    extensionsUsed?: string[];
    generator?: string;
    version?: string;
  };
}

export interface SearchFilterState {
  query: string;
  category: string;
  sortBy: 'relevance' | '-likeCount' | '-viewCount' | '-publishedAt' | '-faceCount' | 'faceCount';
  downloadableOnly: boolean;
  staffpickedOnly: boolean;
  pbrOnly: boolean;
  animatedOnly: boolean;
  riggedOnly: boolean;
  soundOnly: boolean;
  unsafeSearch: boolean;
  license?: string;
  maxFaces?: number;
  minFaces?: number;
  date: string;
  modelType: string;
  viewMode: 'grid' | 'table';
}

export interface HomeSearch {
  q: string;
  category: string;
  sort: string;
  downloadable: boolean;
  staffpicked: boolean;
  pbr: boolean;
  animated: boolean;
  rigged: boolean;
  sound: boolean;
  nsfw: boolean;
  license: string;
  minFaces: number | undefined;
  maxFaces: number | undefined;
  date: string;
  type: string;
  view: 'grid' | 'table';
}

export function normalizeSearch(s: Record<string, unknown>): HomeSearch {
  return {
    q: (s.q as string) || '',
    category: (s.category as string) || '',
    sort: (s.sort as string) || 'relevance',
    downloadable: s.downloadable !== 'false' && s.downloadable !== false,
    staffpicked: s.staffpicked === 'true' || s.staffpicked === true,
    pbr: s.pbr === 'true' || s.pbr === true,
    animated: s.animated === 'true' || s.animated === true,
    rigged: s.rigged === 'true' || s.rigged === true,
    sound: s.sound === 'true' || s.sound === true,
    nsfw: s.nsfw === 'true' || s.nsfw === true,
    license: (s.license as string) || '',
    minFaces: s.minFaces ? Number(s.minFaces) : undefined,
    maxFaces: s.maxFaces ? Number(s.maxFaces) : undefined,
    date: (s.date as string) || '',
    type: (s.type as string) || '',
    view: (s.view as 'grid' | 'table') || 'grid',
  };
}

export function fromHomeSearch(s: HomeSearch): SearchFilterState {
  return {
    query: s.q,
    category: s.category,
    sortBy: (s.sort as SearchFilterState['sortBy']) || 'relevance',
    downloadableOnly: s.downloadable,
    staffpickedOnly: s.staffpicked,
    pbrOnly: s.pbr,
    animatedOnly: s.animated,
    riggedOnly: s.rigged,
    soundOnly: s.sound,
    unsafeSearch: s.nsfw,
    license: s.license || undefined,
    minFaces: s.minFaces,
    maxFaces: s.maxFaces,
    date: s.date,
    modelType: s.type,
    viewMode: s.view,
  };
}

export function toHomeSearch(f: Partial<SearchFilterState>): Partial<HomeSearch> {
  const h: Partial<HomeSearch> = {};
  if ('query' in f && f.query !== undefined) h.q = f.query;
  if ('category' in f && f.category !== undefined) h.category = f.category;
  if ('sortBy' in f && f.sortBy !== undefined) h.sort = f.sortBy;
  if ('downloadableOnly' in f && f.downloadableOnly !== undefined)
    h.downloadable = f.downloadableOnly;
  if ('staffpickedOnly' in f && f.staffpickedOnly !== undefined) h.staffpicked = f.staffpickedOnly;
  if ('pbrOnly' in f && f.pbrOnly !== undefined) h.pbr = f.pbrOnly;
  if ('animatedOnly' in f && f.animatedOnly !== undefined) h.animated = f.animatedOnly;
  if ('riggedOnly' in f && f.riggedOnly !== undefined) h.rigged = f.riggedOnly;
  if ('soundOnly' in f && f.soundOnly !== undefined) h.sound = f.soundOnly;
  if ('unsafeSearch' in f && f.unsafeSearch !== undefined) h.nsfw = f.unsafeSearch;
  if ('license' in f) h.license = f.license || '';
  if ('minFaces' in f) h.minFaces = f.minFaces;
  if ('maxFaces' in f) h.maxFaces = f.maxFaces;
  if ('date' in f && f.date !== undefined) h.date = f.date;
  if ('modelType' in f && f.modelType !== undefined) h.type = f.modelType;
  if ('viewMode' in f && f.viewMode !== undefined) h.view = f.viewMode;
  return h;
}
