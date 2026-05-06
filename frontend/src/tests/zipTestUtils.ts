const encoder = new TextEncoder();

const crcTable = new Uint32Array(256);
for (let index = 0; index < crcTable.length; index += 1) {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  crcTable[index] = crc >>> 0;
}

const crc32 = (bytes: Uint8Array): number => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const concatBytes = (chunks: Uint8Array[]): Uint8Array => {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
};

const localHeader = (name: Uint8Array, data: Uint8Array, crc: number): Uint8Array => {
  const header = new Uint8Array(30 + name.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint32(14, crc, true);
  view.setUint32(18, data.length, true);
  view.setUint32(22, data.length, true);
  view.setUint16(26, name.length, true);
  header.set(name, 30);
  return header;
};

const centralDirectoryHeader = (name: Uint8Array, data: Uint8Array, crc: number, offset: number): Uint8Array => {
  const header = new Uint8Array(46 + name.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint32(16, crc, true);
  view.setUint32(20, data.length, true);
  view.setUint32(24, data.length, true);
  view.setUint16(28, name.length, true);
  view.setUint32(42, offset, true);
  header.set(name, 46);
  return header;
};

export const zipBytes = (entries: Record<string, string>): Uint8Array => {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const [path, text] of Object.entries(entries)) {
    const name = encoder.encode(path);
    const data = encoder.encode(text);
    const checksum = crc32(data);
    const local = localHeader(name, data, checksum);

    locals.push(local, data);
    centrals.push(centralDirectoryHeader(name, data, checksum, offset));
    offset += local.length + data.length;
  }

  const centralOffset = offset;
  const centralDirectory = concatBytes(centrals);
  const end = new Uint8Array(22);
  const view = new DataView(end.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(8, centrals.length, true);
  view.setUint16(10, centrals.length, true);
  view.setUint32(12, centralDirectory.length, true);
  view.setUint32(16, centralOffset, true);

  return concatBytes([...locals, centralDirectory, end]);
};

export const zipFile = (entries: Record<string, string>, name = "skill.zip"): File => {
  const bytes = zipBytes(entries);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new File([buffer], name, { type: "application/zip" });
};
