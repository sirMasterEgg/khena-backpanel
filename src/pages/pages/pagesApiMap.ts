import type { LandingSectionKey } from "./landingTypes";

/** Nama `page` di API — harus cocok dengan yang dibaca storefront (GET /api/pages). */
export const PAGE_NAME = {
	landing: "home",
	faq: "faq",
	returns: "returns",
	shipping: "shipping",
	care: "care",
	assembly: "assembly",
	contract: "contract",
} as const;

/**
 * `section` untuk tab yang isinya satu koleksi item. Satu row menyimpan
 * SELURUH daftar di dalam `data`, karena tidak ada endpoint DELETE (gotcha #10).
 */
export const COLLECTION_SECTION = {
	faq: "items",
	returns: "items",
	shipping: "items",
	care: "items",
	assembly: "manuals",
	contract: "projects",
} as const;

/** Section landing = persis nilai LandingSectionKey yang sudah ada. */
export const LANDING_SECTION_KEYS: LandingSectionKey[] = [
	"mainHero",
	"signatureCollection",
	"craftmanship",
	"designedForLife",
	"bottomHero",
];
