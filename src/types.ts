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
  license?: string;
  maxFaces?: number; // Low poly / High poly filter
  minFaces?: number;
  viewMode: 'grid' | 'table';
}
