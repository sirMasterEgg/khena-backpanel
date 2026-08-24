import { getMediaDownloadUrl, uploadDirect } from "@/api/media";

/**
 * Folder tujuan upload gambar landing page. Dipisah dari root supaya
 * Media Library tidak penuh oleh gambar yang tak pernah dipilih manual.
 * TODO(konfirmasi): pastikan backend auto-create folder ini kalau belum ada.
 */
export const LANDING_MEDIA_PATH = "/landing-page";

/** Batas ukuran per gambar; samakan dengan MediaLibrary agar konsisten. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES =
	"image/png,image/jpeg,image/webp,image/avif";

/**
 * Upload beberapa gambar sekaligus, kembalikan URL siap pakai untuk <img src>.
 * `url` bisa null saat MEDIA_PUBLIC_BASE_URL belum di-set backend — jatuh ke
 * endpoint download yang selalu tersedia (pola sama seperti getMediaPreviewUrl).
 */
export async function uploadLandingImages(files: File[]): Promise<string[]> {
	const results = await uploadDirect(LANDING_MEDIA_PATH, files);
	return results.map((r) => r.url?.trim() || getMediaDownloadUrl(r.mediaId));
}
