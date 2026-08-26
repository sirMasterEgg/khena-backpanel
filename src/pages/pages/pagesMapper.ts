import {
	createFileCollector,
	type PageFilePart,
	type PageRow,
} from "@/api/pages";
import type {
	CraftmanshipSection,
	CraftmanshipSlide,
	DesignedForLifeSection,
	HeroSection,
	SignatureCollectionSection,
} from "./landingTypes";

/** Baca field string dari `data` yang bertipe unknown, dengan fallback aman. */
function str(obj: unknown, key: string): string {
	if (typeof obj !== "object" || obj === null) return "";
	const value = (obj as Record<string, unknown>)[key];
	return typeof value === "string" ? value : "";
}

/** Baca field number dari `data` yang bertipe unknown, dengan fallback aman. */
function num(obj: unknown, key: string, fallback: number): number {
	if (typeof obj !== "object" || obj === null) return fallback;
	const value = (obj as Record<string, unknown>)[key];
	return typeof value === "number" ? value : fallback;
}

/**
 * Baca `url` dari `image` — dipakai untuk craftmanship (slide `image` selalu
 * string biasa) dan juga hero (toleransi row lama yang sempat tersimpan
 * sebagai string biasa, sebelum hero kembali memakai bentuk `{url,alt}`).
 */
function imageUrlFromData(value: unknown): string {
	if (typeof value === "string") return value;
	if (typeof value === "object" && value !== null) {
		const url = (value as Record<string, unknown>).url;
		if (typeof url === "string") return url;
	}
	return "";
}

/**
 * Baca `alt` dari `image` kalau bentuknya object `{url,alt}`. Untuk
 * craftmanship (slide) ini selalu "" karena slide tidak punya alt. Untuk
 * hero, row yang sempat tersimpan sebagai string biasa (masa transisi)
 * juga menghasilkan "" di sini — wajar, alt-nya memang belum pernah disimpan.
 */
function imageAltFromData(value: unknown): string {
	if (typeof value === "object" && value !== null) {
		const alt = (value as Record<string, unknown>).alt;
		if (typeof alt === "string") return alt;
	}
	return "";
}

// ---------- A. Deserialize: PageRow -> tipe UI ----------

/**
 * Dipakai untuk mainHero ("hero") maupun bottomHero ("productBanner") — dua
 * section ini identik bentuknya di storefront, cuma beda `page`+`section`.
 * Nama field UI (eyebrow/headline/ctaLabel/ctaHref) sudah sama persis dengan
 * nama field di `data` — tidak ada lagi terjemahan nama di sini.
 */
export function heroFromRow(row: PageRow, base: HeroSection): HeroSection {
	const image = (row.data as { image?: unknown } | null)?.image;
	return {
		...base,
		status: row.status,
		updatedAt: row.updatedAt,
		// Fallback ke nama lama (subtitle/title/ctaText/ctaLink) untuk row yang
		// sempat tersimpan sebelum field ini di-rename.
		eyebrow: str(row.data, "eyebrow") || str(row.data, "subtitle"),
		headline: str(row.data, "headline") || str(row.data, "title"),
		ctaLabel: str(row.data, "ctaLabel") || str(row.data, "ctaText"),
		ctaHref: str(row.data, "ctaHref") || str(row.data, "ctaLink"),
		image: { url: imageUrlFromData(image), alt: imageAltFromData(image) },
	};
}

export function signatureFromRow(
	row: PageRow,
	base: SignatureCollectionSection,
): SignatureCollectionSection {
	const image = (row.data as { image?: unknown } | null)?.image;
	return {
		...base,
		status: row.status,
		updatedAt: row.updatedAt,
		title: str(row.data, "title"),
		image: { url: str(image, "url"), alt: str(image, "alt") },
	};
}

function slideFromData(value: unknown): CraftmanshipSlide {
	const image = (value as { image?: unknown } | null)?.image;
	return {
		id: str(value, "id") || crypto.randomUUID(),
		image: { url: imageUrlFromData(image), alt: imageAltFromData(image) },
		title: str(value, "title"),
		// "body" adalah nama baru; "description" fallback untuk row lama.
		body: str(value, "body") || str(value, "description"),
	};
}

/** `intervalMs` (baru, milidetik) diutamakan; fallback ke `slideDurationSec` lama (detik). */
function craftmanshipDurationSec(data: unknown, fallbackSec: number): number {
	const intervalMs = num(data, "intervalMs", Number.NaN);
	if (!Number.isNaN(intervalMs)) return intervalMs / 1000;
	return num(data, "slideDurationSec", fallbackSec);
}

export function craftmanshipFromRow(
	row: PageRow,
	base: CraftmanshipSection,
): CraftmanshipSection {
	const slidesValue = (row.data as { slides?: unknown } | null)?.slides;
	return {
		...base,
		status: row.status,
		updatedAt: row.updatedAt,
		eyebrow: str(row.data, "eyebrow"),
		// Fallback ke nama lama (ctaText/ctaLink) untuk row yang sempat
		// tersimpan sebelum field ini di-rename.
		ctaLabel: str(row.data, "ctaLabel") || str(row.data, "ctaText"),
		ctaHref: str(row.data, "ctaHref") || str(row.data, "ctaLink"),
		slides: Array.isArray(slidesValue) ? slidesValue.map(slideFromData) : [],
		slideDurationSec: craftmanshipDurationSec(row.data, base.slideDurationSec),
	};
}

export function designedForLifeFromRow(
	row: PageRow,
	base: DesignedForLifeSection,
): DesignedForLifeSection {
	const productIds = (row.data as { productIds?: unknown } | null)?.productIds;
	return {
		...base,
		status: row.status,
		updatedAt: row.updatedAt,
		productIds: Array.isArray(productIds)
			? productIds.filter((id): id is string => typeof id === "string")
			: [],
	};
}

/** Daftar item (FAQ/returns/shipping/care/manuals/projects) — bisa tidak ada sama sekali. */
export function itemsFromRow<T>(row: PageRow | undefined, key: string): T[] {
	const value = (row?.data as Record<string, unknown> | undefined)?.[key];
	return Array.isArray(value) ? (value as T[]) : [];
}

// ---------- B. Serialize: form UI -> { data, files } ----------

/** Nilai gambar di form: URL lama, atau File baru yang belum diupload. */
export type ImageValue = { url: string; alt: string; file?: File | null };

/**
 * Dipakai untuk mainHero ("hero") maupun bottomHero ("productBanner").
 * `image` bentuknya sama persis dengan Signature Collection: `{url, alt}`.
 */
export function heroToPayload(form: {
	eyebrow: string;
	headline: string;
	ctaLabel: string;
	ctaHref: string;
	image: ImageValue;
}): { data: unknown; files: PageFilePart[] } {
	const collector = createFileCollector();
	const data = {
		eyebrow: form.eyebrow,
		headline: form.headline,
		ctaLabel: form.ctaLabel,
		ctaHref: form.ctaHref,
		// ref() → URL lama apa adanya, ATAU "@file:fN" + file dicatat ke collector
		image: { url: collector.ref(form.image), alt: form.image.alt },
	};
	return { data, files: collector.files };
}

export function signatureToPayload(form: {
	title: string;
	image: ImageValue;
}): { data: unknown; files: PageFilePart[] } {
	const collector = createFileCollector();
	const data = {
		title: form.title,
		image: { url: collector.ref(form.image), alt: form.image.alt },
	};
	return { data, files: collector.files };
}

/** Serialize ke section "craftmanship" — dikirim ke storefront sebagai "materials". */
export function craftmanshipToPayload(form: {
	eyebrow: string;
	ctaLabel: string;
	ctaHref: string;
	slideDurationSec: number;
	slides: {
		id: string;
		image: ImageValue;
		title: string;
		body: string;
	}[];
}): { data: unknown; files: PageFilePart[] } {
	// Satu collector dipakai untuk SEMUA slide — key "fN" tetap unik lintas slide.
	const collector = createFileCollector();
	const data = {
		eyebrow: form.eyebrow,
		ctaLabel: form.ctaLabel,
		ctaHref: form.ctaHref,
		intervalMs: Math.round(form.slideDurationSec * 1000),
		slides: form.slides.map((slide) => ({
			title: slide.title,
			body: slide.body,
			image: collector.ref(slide.image) || null,
		})),
	};
	return { data, files: collector.files };
}

export function designedForLifeToPayload(form: { productIds: string[] }): {
	data: unknown;
	files: PageFilePart[];
} {
	return { data: { productIds: form.productIds }, files: [] };
}
