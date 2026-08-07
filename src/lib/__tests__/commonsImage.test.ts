import {
	commonsSrcSet,
	commonsThumbUrl,
	md5,
	thumbBucket,
} from "../commonsImage";

// RFC 1321 test suite.
test.each([
	["", "d41d8cd98f00b204e9800998ecf8427e"],
	["a", "0cc175b9c0f1b6a831c399e269772661"],
	["abc", "900150983cd24fb0d6963f7d28e17f72"],
	["message digest", "f96b697d7cb7938d525a2f31aaf161d0"],
	["abcdefghijklmnopqrstuvwxyz", "c3fcd3d76192e4007dfb496cca67e13b"],
	[
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
		"d174ab98d277d9f5a5611c2c9f419d9f",
	],
	[
		"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
		"57edf4a22be3c955ac49da2e2107b67a",
	],
])("md5(%j)", (input, expected) => {
	expect(md5(input)).toBe(expected);
});

test("md5 hashes UTF-8 bytes, not code units", () => {
	// Filenames on Commons are routinely non-ASCII; getting the encoding wrong
	// puts the file in the wrong shard directory and every such image 404s.
	expect(md5("Trüsche_Walchensee.jpg")).toBe(
		"149fb51ce7cc97e4c47b2f772235036d",
	);
});

test("md5 handles every padding boundary", () => {
	// 55/56 and 63/64 bytes are where the length block spills into a new chunk.
	expect(md5("a".repeat(55))).toBe("ef1772b6dff9a122358552954ad0df65");
	expect(md5("a".repeat(56))).toBe("3b0c8ac703f828b04c6c197006d17218");
	expect(md5("a".repeat(63))).toBe("b06521f39153d618550606be297466d5");
	expect(md5("a".repeat(64))).toBe("014842d480b571495a4a0363793f7367");
	expect(md5("a".repeat(119))).toBe("8a7bd0732ed6a28ce75f6dabc90e1613");
});

test("rounds requested widths up to a width Wikimedia actually serves", () => {
	// Anything off this ladder is a 400 from upload.wikimedia.org.
	expect(thumbBucket(1)).toBe(20);
	expect(thumbBucket(20)).toBe(20);
	expect(thumbBucket(80)).toBe(120);
	expect(thumbBucket(144)).toBe(250);
	expect(thumbBucket(300)).toBe(500);
	expect(thumbBucket(600)).toBe(960);
	expect(thumbBucket(99999)).toBe(1920);
});

test("builds a direct upload.wikimedia.org thumbnail URL", () => {
	expect(commonsThumbUrl("Carp bream.jpg", 80)).toBe(
		"https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Carp_bream.jpg/120px-Carp_bream.jpg",
	);
});

test("tolerates a File: prefix", () => {
	expect(commonsThumbUrl("File:Carp bream.jpg", 80)).toBe(
		commonsThumbUrl("Carp bream.jpg", 80),
	);
});

test("percent-encodes non-ASCII but leaves MediaWiki's sub-delimiters alone", () => {
	// Verified against upload.wikimedia.org: 200, zero redirects.
	expect(
		commonsThumbUrl(
			"Mullus surmuletus, Bouches-du-Rhône, Provence-Alpes-Côte d'Azur, FR imported from iNaturalist photo 277193780 (cropped).jpg",
			120,
		),
	).toBe(
		"https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Mullus_surmuletus,_Bouches-du-Rh%C3%B4ne,_Provence-Alpes-C%C3%B4te_d'Azur,_FR_imported_from_iNaturalist_photo_277193780_(cropped).jpg/120px-Mullus_surmuletus,_Bouches-du-Rh%C3%B4ne,_Provence-Alpes-C%C3%B4te_d'Azur,_FR_imported_from_iNaturalist_photo_277193780_(cropped).jpg",
	);
});

test("handles a Maltese Ċ and a Spanish ñ in the same title", () => {
	expect(
		commonsThumbUrl(
			"Oblada (Oblada melanura), Ċirkewwa, Malta, Malta, 2021-08-24, DD 26.jpg",
			120,
		),
	).toBe(
		"https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Oblada_(Oblada_melanura),_%C4%8Airkewwa,_Malta,_Malta,_2021-08-24,_DD_26.jpg/120px-Oblada_(Oblada_melanura),_%C4%8Airkewwa,_Malta,_Malta,_2021-08-24,_DD_26.jpg",
	);
	expect(
		commonsThumbUrl(
			"Boga (Boops boops), franja marina Teno-Rasca, Tenerife, España, 2022-01-08, DD 99.jpg",
			120,
		),
	).toContain("Espa%C3%B1a");
});

test("renders SVG and TIFF thumbnails to a raster extension", () => {
	expect(commonsThumbUrl("202409 Atlantic Salmon.svg", 120)).toBe(
		"https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/202409_Atlantic_Salmon.svg/120px-202409_Atlantic_Salmon.svg.png",
	);
	expect(commonsThumbUrl("Some scan.tiff", 120)).toContain(
		"/120px-Some_scan.tiff.jpg",
	);
});

test("leaves GIF and uppercase JPG extensions as they are", () => {
	expect(commonsThumbUrl("Auxis thazard thazard (frigate tuna).gif", 120)).toBe(
		"https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Auxis_thazard_thazard_(frigate_tuna).gif/120px-Auxis_thazard_thazard_(frigate_tuna).gif",
	);
	expect(
		commonsThumbUrl(
			"Carassius carassius - Swedish Museum of Natural History - Stockholm, Sweden - DSC00594.JPG",
			120,
		),
	).toContain("/120px-Carassius_carassius_-_Swedish_Museum");
});

test("srcset offers sorted, deduplicated buckets with w descriptors", () => {
	expect(commonsSrcSet("Carp bream.jpg", [250, 500])).toBe(
		"https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Carp_bream.jpg/250px-Carp_bream.jpg 250w, " +
			"https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Carp_bream.jpg/500px-Carp_bream.jpg 500w",
	);
	// 80 and 100 both round to 120, so only one candidate should survive.
	expect(commonsSrcSet("Carp bream.jpg", [80, 100, 40])).toBe(
		"https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Carp_bream.jpg/40px-Carp_bream.jpg 40w, " +
			"https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Carp_bream.jpg/120px-Carp_bream.jpg 120w",
	);
});

test("no constructed URL points at commons.wikimedia.org", () => {
	// The whole point: commons.wikimedia.org/wiki/Special:FilePath is a
	// two-hop redirect stub, upload.wikimedia.org is the bytes.
	for (const url of [
		commonsThumbUrl("Carp bream.jpg", 250),
		...commonsSrcSet("Carp bream.jpg", [250, 500]).split(", "),
	]) {
		expect(url.startsWith("https://upload.wikimedia.org/")).toBe(true);
	}
});
