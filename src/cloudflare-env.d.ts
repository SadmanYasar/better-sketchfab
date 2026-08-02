interface KVNamespace {
  get(key: string): Promise<string | null>;
  get(key: string, type: 'text'): Promise<string | null>;
  get<T>(key: string, type: 'json'): Promise<T | null>;
  put(
    key: string,
    value: string | ArrayBuffer | ArrayBufferView | ReadableStream,
    options?: { expirationTtl?: number; expiration?: number; metadata?: unknown },
  ): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
    keys: Array<{ name: string; expiration?: number; metadata?: unknown }>;
    cursor?: string;
  }>;
  getWithMetadata<T = unknown, Meta = unknown>(
    key: string,
    type?: 'text',
    options?: { type: 'text' },
  ): Promise<{ value: string | null; metadata: Meta | null }>;
}

declare module 'cloudflare:workers' {
  const env: {
    METADATA_CACHE: KVNamespace;
  };
  export { env };
}

declare module 'cloudflare:test' {
  interface ProvidedEnv {
    METADATA_CACHE: KVNamespace;
  }
}

