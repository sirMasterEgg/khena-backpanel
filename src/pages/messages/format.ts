// Helper format kecil khusus halaman Contact Messages.

import dayjs from "dayjs";

/**
 * Waktu ringkas untuk baris daftar pesan: hari ini → "09:41", kemarin →
 * "Kemarin", tahun yang sama → "12 Aug", selain itu → "12 Aug 2025".
 * Tidak pakai plugin relativeTime — belum pernah didaftarkan di project ini.
 */
export function formatInboxTime(iso: string): string {
	const date = dayjs(iso);
	const now = dayjs();
	if (date.isSame(now, "day")) return date.format("HH:mm");
	if (date.isSame(now.subtract(1, "day"), "day")) return "Kemarin";
	if (date.isSame(now, "year")) return date.format("DD MMM");
	return date.format("DD MMM YYYY");
}

/** Tanggal lengkap untuk panel baca, mis. "12 Aug 2026, 11:21". */
export function formatFullDate(iso: string): string {
	return dayjs(iso).format("DD MMM YYYY, HH:mm");
}

/** Ambil nama file dari objectKey, mis. "inquiry/2026/denah.pdf" → "denah.pdf". */
export function attachmentFileName(objectKey: string): string {
	const segments = objectKey.split("/");
	return segments[segments.length - 1];
}
