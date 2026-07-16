/**
 * Dependency-free ZIP writer (STORE method, CRC-32) — pure byte assembly, no
 * compression, no filesystem, no Node APIs. Enough for packaging a static site
 * export; every mainstream unzip tool reads STORE archives. UTF-8 filenames
 * (general-purpose flag bit 11).
 */

export interface ZipEntry {
  /** Archive-relative path, forward slashes, no leading slash. */
  path: string;
  data: Uint8Array | string;
}

const textEncoder = new TextEncoder();

// --- CRC-32 (IEEE 802.3, reflected) ----------------------------------------

const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// --- Byte assembly ----------------------------------------------------------

class ByteWriter {
  private chunks: Uint8Array[] = [];
  private length = 0;

  get offset(): number {
    return this.length;
  }

  u16(v: number): void {
    this.push(new Uint8Array([v & 0xff, (v >>> 8) & 0xff]));
  }

  u32(v: number): void {
    this.push(
      new Uint8Array([v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff]),
    );
  }

  push(bytes: Uint8Array): void {
    this.chunks.push(bytes);
    this.length += bytes.length;
  }

  bytes(): Uint8Array {
    const out = new Uint8Array(this.length);
    let pos = 0;
    for (const c of this.chunks) {
      out.set(c, pos);
      pos += c.length;
    }
    return out;
  }
}

function dosDateTime(d: Date): { time: number; date: number } {
  const year = Math.max(1980, d.getFullYear());
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2),
    date: (((year - 1980) & 0x7f) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

const FLAG_UTF8 = 0x0800;

/**
 * Build a ZIP archive (STORE only) from a list of entries. `timestamp` stamps
 * every entry (callers pass "now"; tests pass a fixed date for determinism).
 */
export function zipStore(entries: ZipEntry[], timestamp: Date = new Date(2026, 0, 1)): Uint8Array {
  const w = new ByteWriter();
  const { time, date } = dosDateTime(timestamp);
  const central: Array<{ name: Uint8Array; crc: number; size: number; offset: number }> = [];

  for (const entry of entries) {
    const name = textEncoder.encode(entry.path.replace(/^\/+/, ''));
    const data =
      typeof entry.data === 'string' ? textEncoder.encode(entry.data) : entry.data;
    const crc = crc32(data);
    const offset = w.offset;

    // Local file header
    w.u32(0x04034b50);
    w.u16(20); // version needed
    w.u16(FLAG_UTF8);
    w.u16(0); // method: STORE
    w.u16(time);
    w.u16(date);
    w.u32(crc);
    w.u32(data.length); // compressed
    w.u32(data.length); // uncompressed
    w.u16(name.length);
    w.u16(0); // extra length
    w.push(name);
    w.push(data);

    central.push({ name, crc, size: data.length, offset });
  }

  const centralStart = w.offset;
  for (const c of central) {
    w.u32(0x02014b50);
    w.u16(20); // version made by
    w.u16(20); // version needed
    w.u16(FLAG_UTF8);
    w.u16(0); // method
    w.u16(time);
    w.u16(date);
    w.u32(c.crc);
    w.u32(c.size);
    w.u32(c.size);
    w.u16(c.name.length);
    w.u16(0); // extra
    w.u16(0); // comment
    w.u16(0); // disk number
    w.u16(0); // internal attrs
    w.u32(0); // external attrs
    w.u32(c.offset);
    w.push(c.name);
  }
  const centralSize = w.offset - centralStart;

  // End of central directory
  w.u32(0x06054b50);
  w.u16(0); // disk
  w.u16(0); // central dir disk
  w.u16(central.length);
  w.u16(central.length);
  w.u32(centralSize);
  w.u32(centralStart);
  w.u16(0); // comment length

  return w.bytes();
}
