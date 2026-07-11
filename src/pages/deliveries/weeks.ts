// Helper murni (tanpa React) untuk logika minggu di halaman Deliveries.
// Minggu dimulai Senin dan berakhir Minggu.

import dayjs from "dayjs";

/** Kembalikan Senin 00:00 dari minggu yang memuat `date`. */
export function getWeekStart(date: Date): Date {
	const d = dayjs(date);
	// Rumus (day+6)%7 mengubah Minggu=0…Sabtu=6 menjadi jarak hari ke Senin.
	const offset = (d.day() + 6) % 7;
	return d.startOf("day").subtract(offset, "day").toDate();
}

/** Array 7 tanggal (Sen…Min) mulai dari `weekStart`. */
export function getWeekDays(weekStart: Date): Date[] {
	const start = dayjs(weekStart);
	return Array.from({ length: 7 }, (_, i) => start.add(i, "day").toDate());
}

/** True bila `a` dan `b` jatuh pada hari yang sama (jam diabaikan). */
export function isSameDay(a: Date, b: Date): boolean {
	return dayjs(a).isSame(dayjs(b), "day");
}

/** Judul kartu, mis. "6 – 12 Jul 2026". */
export function formatWeekRange(weekStart: Date): string {
	const start = dayjs(weekStart);
	const end = start.add(6, "day");
	// Bila bulan/tahun sama, cukup tampilkan angka tanggal di awal rentang.
	if (start.isSame(end, "month")) {
		return `${start.format("D")} – ${end.format("D MMM YYYY")}`;
	}
	if (start.isSame(end, "year")) {
		return `${start.format("D MMM")} – ${end.format("D MMM YYYY")}`;
	}
	return `${start.format("D MMM YYYY")} – ${end.format("D MMM YYYY")}`;
}

/** Geser `weekStart` sebanyak `delta` minggu (untuk tombol ‹ / ›). */
export function addWeeks(weekStart: Date, delta: number): Date {
	return dayjs(weekStart).add(delta, "week").toDate();
}
