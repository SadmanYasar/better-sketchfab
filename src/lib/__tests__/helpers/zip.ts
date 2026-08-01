function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let k = 0; k < 8; k++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value: number, out: number[]): void {
  out.push(value & 0xff, (value >>> 8) & 0xff);
}

function u32(value: number, out: number[]): void {
  out.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

export function buildMinimalZip(filename: string, content: string): Uint8Array {
  const data = new TextEncoder().encode(content);
  const name = new TextEncoder().encode(filename);
  const crc = crc32(data);
  const centralSize = 46 + name.length;

  const bytes: number[] = [];

  u32(0x04034b50, bytes);
  u16(20, bytes);
  u16(0, bytes);
  u16(0, bytes);
  u16(0, bytes);
  u16(0, bytes);
  u32(crc, bytes);
  u32(data.length, bytes);
  u32(data.length, bytes);
  u16(name.length, bytes);
  u16(0, bytes);
  bytes.push(...name);
  bytes.push(...data);

  const centralOffset = bytes.length;

  u32(0x02014b50, bytes);
  u16(20, bytes);
  u16(20, bytes);
  u16(0, bytes);
  u16(0, bytes);
  u16(0, bytes);
  u16(0, bytes);
  u32(crc, bytes);
  u32(data.length, bytes);
  u32(data.length, bytes);
  u16(name.length, bytes);
  u16(0, bytes);
  u16(0, bytes);
  u16(0, bytes);
  u16(0, bytes);
  u32(0, bytes);
  u32(0, bytes);
  bytes.push(...name);

  u32(0x06054b50, bytes);
  u16(0, bytes);
  u16(0, bytes);
  u16(1, bytes);
  u16(1, bytes);
  u32(centralSize, bytes);
  u32(centralOffset, bytes);
  u16(0, bytes);

  return new Uint8Array(bytes);
}

export function sliceZip(zip: Uint8Array, offset: number, size: number): Uint8Array {
  const start = Math.max(0, offset);
  const end = Math.min(zip.length, offset + size);
  return zip.slice(start, end);
}
