/**
 * Direct Wikimedia Commons thumbnail URLs.
 *
 * The obvious way to show a Commons file is
 * `commons.wikimedia.org/wiki/Special:FilePath/{file}?width={w}`, but that is a
 * redirect stub: it 302s to `Special:Redirect/file/...`, which 302s again to the
 * real bytes on `upload.wikimedia.org`. Measured against production that was
 * 2 redirects and ~0.70 s for a 3.7 KB thumbnail — paid once per image.
 *
 * The real location is derivable with no network calls at all:
 *
 *   upload.wikimedia.org/wikipedia/commons/thumb/{a}/{ab}/{file}/{w}px-{file}
 *
 * where `a`/`ab` are the first 1 and 2 hex digits of md5(file) and `file` has
 * spaces replaced by underscores. SubtleCrypto has no md5, so a small md5 is
 * bundled below — ~40 lines of pure computation, which is cheaper than the
 * alternative (asking the MediaWiki `imageinfo` API for `iiurlwidth`, which
 * would trade two redirects for a whole extra API round trip that has to
 * complete before the browser can even start the image request).
 */

/**
 * Wikimedia only serves thumbnails at a fixed set of widths; anything else is
 * a 400. `Special:FilePath?width=600` looked like it worked only because the
 * redirect chain silently rounded up for us (600 → 960). Constructing URLs
 * directly means doing that rounding here.
 *
 * Verified by probing upload.wikimedia.org across 20 widths on two files:
 * every width outside this list returned 400.
 */
const THUMB_BUCKETS = [20, 40, 60, 120, 250, 500, 960, 1280, 1920] as const;

/** Smallest served width that is at least `width`. */
export function thumbBucket(width: number): number {
	return (
		THUMB_BUCKETS.find((b) => b >= width) ??
		THUMB_BUCKETS[THUMB_BUCKETS.length - 1]
	);
}

/* ------------------------------------------------------------------ */
/* md5                                                                 */
/* ------------------------------------------------------------------ */

const S = [
	7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
	9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
	16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15,
	21,
];

const K = new Uint32Array(64);
for (let i = 0; i < 64; i++) {
	K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);
}

function rotl(x: number, c: number): number {
	return (x << c) | (x >>> (32 - c));
}

/** Hex md5 of a UTF-8 string. Only used for Commons path sharding. */
export function md5(input: string): string {
	const bytes = new TextEncoder().encode(input);
	const bitLen = bytes.length * 8;
	// message + 0x80 + zero padding to 56 mod 64 + 8-byte little-endian length
	const paddedLen = ((bytes.length + 8) >>> 6) * 64 + 64;
	const msg = new Uint8Array(paddedLen);
	msg.set(bytes);
	msg[bytes.length] = 0x80;
	const view = new DataView(msg.buffer);
	view.setUint32(paddedLen - 8, bitLen >>> 0, true);
	view.setUint32(paddedLen - 4, Math.floor(bitLen / 4294967296), true);

	let a0 = 0x67452301;
	let b0 = 0xefcdab89;
	let c0 = 0x98badcfe;
	let d0 = 0x10325476;

	const M = new Uint32Array(16);
	for (let off = 0; off < paddedLen; off += 64) {
		for (let i = 0; i < 16; i++) M[i] = view.getUint32(off + i * 4, true);

		let a = a0;
		let b = b0;
		let c = c0;
		let d = d0;

		for (let i = 0; i < 64; i++) {
			let f: number;
			let g: number;
			if (i < 16) {
				f = (b & c) | (~b & d);
				g = i;
			} else if (i < 32) {
				f = (d & b) | (~d & c);
				g = (5 * i + 1) % 16;
			} else if (i < 48) {
				f = b ^ c ^ d;
				g = (3 * i + 5) % 16;
			} else {
				f = c ^ (b | ~d);
				g = (7 * i) % 16;
			}
			const tmp = d;
			d = c;
			c = b;
			b = (b + rotl((a + f + K[i] + M[g]) >>> 0, S[i])) >>> 0;
			a = tmp;
		}

		a0 = (a0 + a) >>> 0;
		b0 = (b0 + b) >>> 0;
		c0 = (c0 + c) >>> 0;
		d0 = (d0 + d) >>> 0;
	}

	return [a0, b0, c0, d0].map(hexLE).join("");
}

/** 32-bit word as little-endian hex, the byte order md5 digests use. */
function hexLE(word: number): string {
	let out = "";
	for (let i = 0; i < 4; i++) {
		out += ((word >>> (i * 8)) & 0xff).toString(16).padStart(2, "0");
	}
	return out;
}

/* ------------------------------------------------------------------ */
/* URL construction                                                    */
/* ------------------------------------------------------------------ */

/**
 * MediaWiki stores titles with underscores, and leaves a handful of
 * sub-delimiters unescaped that `encodeURIComponent` would percent-encode.
 * Both forms resolve, but matching MediaWiki's own output keeps us on the
 * cached variant instead of minting a second cache key for the same bytes.
 */
function encodeTitle(name: string): string {
	return encodeURIComponent(name).replace(/%2C/g, ",");
}

function normalize(filename: string): string {
	return filename.replace(/^File:/i, "").replace(/ /g, "_");
}

/**
 * Thumbnails of non-raster originals are rendered to a raster format, and the
 * rendered extension is appended rather than replacing the original one.
 */
function thumbFileName(name: string, width: number): string {
	const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
	if (ext === "svg") return `${width}px-${name}.png`;
	if (ext === "tif" || ext === "tiff") return `${width}px-${name}.jpg`;
	return `${width}px-${name}`;
}

/** Directory shard `{a}/{ab}` that Commons derives from md5 of the title. */
function shard(name: string): string {
	const h = md5(name);
	return `${h[0]}/${h.slice(0, 2)}`;
}

/**
 * Direct thumbnail URL. `width` is rounded up to the nearest width Wikimedia
 * actually serves.
 */
export function commonsThumbUrl(filename: string, width: number): string {
	const name = normalize(filename);
	const w = thumbBucket(width);
	return `https://upload.wikimedia.org/wikipedia/commons/thumb/${shard(name)}/${encodeTitle(name)}/${encodeTitle(thumbFileName(name, w))}`;
}

/**
 * `srcset` over the given candidate widths, so the browser picks the right
 * bucket for its own DPR rather than us guessing one.
 */
export function commonsSrcSet(filename: string, widths: number[]): string {
	const buckets = [...new Set(widths.map(thumbBucket))].sort((a, b) => a - b);
	return buckets.map((w) => `${commonsThumbUrl(filename, w)} ${w}w`).join(", ");
}
