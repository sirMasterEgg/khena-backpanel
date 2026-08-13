// Helper rentang tanggal untuk filter Dashboard. Data Dashboard & Pending
// Tasks sekarang datang dari REST API (src/api/dashboard.ts) — file ini
// tinggal menyisakan helper tanggal yang dipakai PeriodFilter & Dashboard.

import dayjs from "dayjs";

/** Rentang tanggal `[start, end]` (format "YYYY-MM-DD") untuk kedua ujung. */
export type DateRange = [string | null, string | null];

const fmt = (d: dayjs.Dayjs) => d.format("YYYY-MM-DD");

/**
 * Rentang tanggal kalender untuk sebuah periode, dihitung dari hari ini.
 * Dipakai sebagai preset/suggestion di filter tanggal Dashboard.
 * Quarter dihitung manual supaya tidak butuh plugin dayjs `quarterOfYear`.
 */
export function rangeForPeriod(
	period: "week" | "month" | "quarter" | "year",
): [string, string] {
	const now = dayjs();
	switch (period) {
		case "week":
			return [fmt(now.startOf("week")), fmt(now.endOf("week"))];
		case "month":
			return [fmt(now.startOf("month")), fmt(now.endOf("month"))];
		case "quarter": {
			const start = now.month(Math.floor(now.month() / 3) * 3).startOf("month");
			const end = start.add(2, "month").endOf("month");
			return [fmt(start), fmt(end)];
		}
		case "year":
			return [fmt(now.startOf("year")), fmt(now.endOf("year"))];
	}
}

/** Keterangan rentang tanggal untuk ditampilkan, mis. "Jul 13 – Jul 19, 2026". */
export function formatDateRange(range: DateRange): string {
	const [start, end] = range;
	if (!start || !end) return "";
	const s = dayjs(start);
	const e = dayjs(end);
	const startFmt = s.isSame(e, "year")
		? s.format("MMM D")
		: s.format("MMM D, YYYY");
	return `${startFmt} – ${e.format("MMM D, YYYY")}`;
}
