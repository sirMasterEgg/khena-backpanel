// ---------- Pages: Landing sections ----------

export type LandingSectionKey =
	| "mainHero"
	| "signatureCollection"
	| "craftmanship"
	| "designedForLife"
	| "bottomHero";

export type LandingStatus = "published" | "draft";

/** Gambar + alt text; alt wajib diisi untuk aksesibilitas & SEO. */
export type LandingImage = {
	url: string;
	alt: string;
};

type LandingSectionBase = {
	/** Identitas section — TETAP, tidak pernah dibuat/dihapus user. */
	key: LandingSectionKey;
	/** Label yang tampil di kartu list, mis. "Main Hero". */
	label: string;
	status: LandingStatus;
	updatedAt: string;
};

export type HeroSection = LandingSectionBase & {
	kind: "hero";
	key: "mainHero" | "bottomHero";
	/** Small text above the headline. */
	eyebrow: string;
	headline: string;
	ctaLabel: string;
	/** Selalu disimpan dengan "/" di depan, mis. "/collections". */
	ctaHref: string;
	image: LandingImage;
};

export type SignatureCollectionSection = LandingSectionBase & {
	kind: "signature";
	key: "signatureCollection";
	title: string;
	image: LandingImage;
};

export type CraftmanshipSlide = {
	id: string;
	image: LandingImage;
	title: string;
	body: string;
};

export type CraftmanshipSection = LandingSectionBase & {
	kind: "craftmanship";
	key: "craftmanship";
	/** Small text above the CTA. */
	eyebrow: string;
	ctaLabel: string;
	ctaHref: string;
	slides: CraftmanshipSlide[];
	/** Durasi auto-rotation carousel (detik). Dipertahankan dari editor lama. */
	slideDurationSec: number;
};

export type DesignedForLifeSection = LandingSectionBase & {
	kind: "productGrid";
	key: "designedForLife";
	/** ID produk dari database. Harus tepat 6 saat disimpan. */
	productIds: string[];
};

export type LandingSection =
	| HeroSection
	| SignatureCollectionSection
	| CraftmanshipSection
	| DesignedForLifeSection;

/**
 * Bentuk awal 5 section landing saat row-nya belum pernah dibuat di database.
 * Ditampilkan sebagai form kosong; row baru lahir saat user menekan Save.
 */
export const DEFAULT_LANDING_SECTIONS: LandingSection[] = [
	{
		kind: "hero",
		key: "mainHero",
		label: "Main Hero",
		status: "draft",
		updatedAt: "",
		eyebrow: "",
		headline: "",
		ctaLabel: "",
		ctaHref: "",
		image: { url: "", alt: "" },
	},
	{
		kind: "signature",
		key: "signatureCollection",
		label: "Signature Collection",
		status: "draft",
		updatedAt: "",
		title: "",
		image: { url: "", alt: "" },
	},
	{
		kind: "craftmanship",
		key: "craftmanship",
		label: "Craftmanship",
		status: "draft",
		updatedAt: "",
		eyebrow: "",
		ctaLabel: "",
		ctaHref: "",
		slides: [],
		slideDurationSec: 5,
	},
	{
		kind: "productGrid",
		key: "designedForLife",
		label: "Designed for Life",
		status: "draft",
		updatedAt: "",
		productIds: [],
	},
	{
		kind: "hero",
		key: "bottomHero",
		label: "Bottom Hero",
		status: "draft",
		updatedAt: "",
		eyebrow: "",
		headline: "",
		ctaLabel: "",
		ctaHref: "",
		image: { url: "", alt: "" },
	},
];

// ---------- Pages: Q&A (FAQ / Returns / Shipping / Care) ----------

export type QnaItem = {
	id: string;
	question: string;
	answer: string;
	category?: string; // hanya dipakai FAQ
	updatedAt: string;
};

// Opsi kategori FAQ (dipakai Select di QnaItemModal)
export const FAQ_CATEGORIES = [
	"Ordering",
	"Payment",
	"Delivery",
	"Product Care",
	"Warranty",
] as const;

// ---------- Pages: Assembly manuals ----------

export type AssemblyManual = {
	id: string;
	productName: string;
	productSku?: string; // opsional, mis. "SOF-OAK-3S"
	fileName: string; // mis. "sofa-assembly.pdf"
	fileSize: string; // mis. "1.2 MB"
	/** URL download PDF — hasil pilih dari Media Library (gotcha #11). */
	fileUrl: string;
	updatedAt: string;
};

// ---------- Pages: Contract projects ----------

export type ContractProject = {
	id: string;
	field: string; // kategori/industri proyek, mis. "Hospitality"
	description: string; // deskripsi singkat
	status: "published" | "draft";
	updatedAt: string;
};
