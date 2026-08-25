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

// ---------- A. Deserialize: PageRow -> tipe UI ----------

export function heroFromRow(row: PageRow, base: HeroSection): HeroSection {
	const image = (row.data as { image?: unknown } | null)?.image;
	return {
		...base,
		status: row.status,
		updatedAt: row.updatedAt,
		subtitle: str(row.data, "subtitle"),
		title: str(row.data, "title"),
		ctaText: str(row.data, "ctaText"),
		ctaLink: str(row.data, "ctaLink"),
		image: { url: str(image, "url"), alt: str(image, "alt") },
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
		image: { url: str(image, "url"), alt: str(image, "alt") },
		caption: str(value, "caption"),
		title: str(value, "title"),
		description: str(value, "description"),
	};
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
		ctaText: str(row.data, "ctaText"),
		ctaLink: str(row.data, "ctaLink"),
		slides: Array.isArray(slidesValue) ? slidesValue.map(slideFromData) : [],
		slideDurationSec: num(row.data, "slideDurationSec", base.slideDurationSec),
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

export function heroToPayload(form: {
	subtitle: string;
	title: string;
	ctaText: string;
	ctaLink: string;
	image: ImageValue;
}): { data: unknown; files: PageFilePart[] } {
	const collector = createFileCollector();
	const data = {
		subtitle: form.subtitle,
		title: form.title,
		ctaText: form.ctaText,
		ctaLink: form.ctaLink,
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

export function craftmanshipToPayload(form: {
	ctaText: string;
	ctaLink: string;
	slideDurationSec: number;
	slides: {
		id: string;
		image: ImageValue;
		caption: string;
		title: string;
		description: string;
	}[];
}): { data: unknown; files: PageFilePart[] } {
	// Satu collector dipakai untuk SEMUA slide — key "fN" tetap unik lintas slide.
	const collector = createFileCollector();
	const data = {
		ctaText: form.ctaText,
		ctaLink: form.ctaLink,
		slideDurationSec: form.slideDurationSec,
		slides: form.slides.map((slide) => ({
			id: slide.id,
			image: { url: collector.ref(slide.image), alt: slide.image.alt },
			caption: slide.caption,
			title: slide.title,
			description: slide.description,
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
