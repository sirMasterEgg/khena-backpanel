import { apiClient } from "@/api/client";
import type { MediaFile } from "@/api/media";
import type { ApiListSuccess, ApiSuccess } from "@/api/types";

export type ProductStatus = "published" | "draft" | "scheduled" | "archived";

export type ProductVariantVisibility = "visible" | "hidden";

/**
 * Bentuk 1 item pada GET /products (contract.md bagian 6).
 * PENTING: endpoint list TIDAK mengembalikan harga, stok, maupun collection —
 * kolom UI yang butuh data itu diisi placeholder.
 */
export type ProductListItem = {
	id: string;
	name: string;
	baseSku: string;
	status: ProductStatus | null;
	description: string | null;
	category: { id: string; name: string };
	createdAt: string;
	updatedAt: string;
};

/** `{ width, depth, height, weight, media }` pada response detail. */
export type ProductDimensionDetail = {
	width: number;
	depth: number;
	height: number;
	weight: number;
	/** DITERIMA sebagai objek File — di request dikirim uuid lewat `image`. */
	media: MediaFile | null;
};

export type ProductVariantDetail = {
	id: string;
	colorId: string;
	/** Di request field ini bernama `sku`. */
	detailProductSku: string;
	price: number;
	discountPercent: number | null;
	capitalPrice: number;
	marketplacePrice: number | null;
	visibility: ProductVariantVisibility;
	images: MediaFile[];
};

/**
 * Bentuk GET /products/:id (contract.md bagian 6).
 * Nama field di RESPONSE berbeda dengan di REQUEST — bandingkan dgn
 * ProductInput: `name`/`productName`, `materials`/`materialInformation`,
 * `careInstructions`/`careInstructionIds`, `variants`/`variant`.
 * `initialStock` dan `collectionId` TIDAK ada di response.
 */
export type ProductDetail = {
	id: string;
	name: string;
	baseSku: string;
	description: string | null;
	materials: string | null;
	status: ProductStatus | null;
	lowStockAlert: number | null;
	category: { id: string; name: string };
	productDimension: ProductDimensionDetail;
	boxDimension: ProductDimensionDetail;
	careInstructions: { id: string; instruction: string }[];
	media: MediaFile[];
	variants: ProductVariantDetail[];
};

/** Bentuk 1 item `variant` untuk POST (contract.md bagian 6). */
export type ProductVariantInput = {
	colorId: string;
	/** Harus diawali `baseSku` — divalidasi juga di frontend (productSchema). */
	sku: string;
	visibility: ProductVariantVisibility;
	price: number;
	capitalPrice: number;
	discountPercent?: number;
	marketplacePrice?: number;
	/** Hanya dipakai backend untuk varian BARU (tanpa `id` saat PATCH). */
	initialStock: number;
	/** DIKIRIM sebagai uuid media — di response jadi objek File[]. */
	images: string[];
};

/** `{ width, depth, height, weight, image }` untuk request body. */
export type ProductDimensionInput = {
	width: number;
	depth: number;
	height: number;
	weight: number;
	/** DIKIRIM sebagai uuid media — di response jadi `media: MediaFile | null`. */
	image: string;
};

/** Body POST /products lengkap (contract.md bagian 6). */
export type ProductInput = {
	productName: string;
	baseSku: string;
	collectionId?: string;
	categoryId: string;
	status: ProductStatus;
	description?: string;
	lowStockAlert?: number;
	materialInformation: string;
	careInstructionIds: string[];
	productDimension: ProductDimensionInput;
	boxDimension: ProductDimensionInput;
	media: string[];
	variant: ProductVariantInput[];
};

/**
 * PATCH bersifat partial, tapi kalau `variant` dikirim: tiap item harus
 * lengkap, item ber-`id` = update, tanpa `id` = varian baru, dan varian lama
 * yang tidak ada di body di-soft-delete. `careInstructionIds` dan `media`
 * bersifat replace seluruhnya.
 */
export type ProductPatchInput = Partial<Omit<ProductInput, "variant">> & {
	variant?: (ProductVariantInput & { id?: string })[];
};

export type ProductSortField = "name" | "createdAt" | "status";

export type ProductListParams = {
	search?: string;
	categoryId?: string;
	status?: ProductStatus;
	sort?: ProductSortField;
	order?: "asc" | "desc";
	page?: number;
	limit?: number;
};

/** Ringkasan agregat produk (contract.md bagian 6, GET /products/stats). */
export type ProductStats = {
	totalProducts: number;
	totalInventory: number;
	totalOutOfStock: number;
	totalPublished: number;
	totalDraft: number;
	totalScheduled: number;
	totalArchived: number;
};

export async function getProductStats() {
	const res = await apiClient.get<ApiSuccess<ProductStats>>("/products/stats");
	return res.data.data;
}

export async function listProducts(params?: ProductListParams) {
	const res = await apiClient.get<ApiListSuccess<ProductListItem>>(
		"/products",
		{ params },
	);
	return res.data;
}

export async function getProduct(id: string) {
	const res = await apiClient.get<ApiSuccess<ProductDetail>>(`/products/${id}`);
	return res.data.data;
}

export async function createProduct(body: ProductInput) {
	const res = await apiClient.post<ApiSuccess<ProductDetail>>(
		"/products",
		body,
	);
	return res.data.data;
}

export async function patchProduct(id: string, body: ProductPatchInput) {
	const res = await apiClient.patch<ApiSuccess<ProductDetail>>(
		`/products/${id}`,
		body,
	);
	return res.data.data;
}

export async function deleteProduct(id: string) {
	const res = await apiClient.delete<ApiSuccess<"OK">>(`/products/${id}`);
	return res.data.data;
}
