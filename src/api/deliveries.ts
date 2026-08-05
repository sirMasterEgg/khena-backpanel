import { apiClient } from "@/api/client";
import type { ApiSuccess } from "@/api/types";

/**
 * Status order yang bisa muncul di papan delivery. Order `completed` dan
 * `cancelled` difilter server, jadi tidak pernah sampai ke sini.
 */
export type DeliveryStatus = "pending" | "processing" | "shipped";

export type DeliveryTimeSlot = "morning" | "afternoon" | "evening";

/** Objeknya selalu ada, tapi tiap FIELD-nya bisa null bila order tanpa customer. */
export type DeliveryCustomer = {
	id: string | null;
	name: string | null;
	phone: string | null;
};

/* ---------- GET /deliveries/stats ---------- */
export type DeliveryStats = {
	/** Minggu BERJALAN (Senin–Minggu), bukan minggu yang sedang dilihat user. */
	thisWeek: number;
	overdue: number;
};

/* ---------- GET /deliveries/overdue ---------- */
export type OverdueDelivery = {
	/** sales_orders.id (uuid) — dipakai untuk navigasi ke /orders/:id. */
	id: string;
	date: string; // "YYYY-MM-DD"
	/** Minimal 1. */
	daysOverdue: number;
	invoiceNumber: string;
	/** Tidak pernah "shipped": barang yang sudah jalan tidak dihitung telat. */
	status: Exclude<DeliveryStatus, "shipped">;
	customer: DeliveryCustomer;
	city: string | null;
};

/* ---------- GET /deliveries?start&end ---------- */
/**
 * PERHATIKAN: di response mingguan kota ada di `shippingDetail.city`, sedangkan
 * di response overdue ada di `city` (flat). Bentuknya memang beda.
 */
export type DeliveryShippingDetail = {
	address: string;
	city: string;
	province: string;
	zipCode: string;
	timeSlot: DeliveryTimeSlot | null;
	notes: string | null;
	trackingNumber: string | null;
};

export type WeeklyDelivery = {
	id: string;
	invoiceNumber: string;
	status: DeliveryStatus;
	customer: DeliveryCustomer;
	shippingDetail: DeliveryShippingDetail;
};

export type DeliveryDayName =
	| "monday"
	| "tuesday"
	| "wednesday"
	| "thursday"
	| "friday"
	| "saturday"
	| "sunday";

export type DeliveryDay = {
	date: string; // "YYYY-MM-DD"
	dayName: DeliveryDayName;
	/** Bisa array kosong — server tetap mengirim harinya. */
	deliveries: WeeklyDelivery[];
};

/**
 * `data` GET /deliveries adalah OBJEK, bukan array — hari-harinya ada di
 * `days`. `date` cuma echo dari query `start`/`end` yang dikirim.
 */
export type WeeklyDeliveries = {
	date: { start: string; end: string };
	/** Selalu tepat 7 elemen, urut Senin → Minggu. */
	days: DeliveryDay[];
};

export async function getDeliveryStats() {
	const res =
		await apiClient.get<ApiSuccess<DeliveryStats>>("/deliveries/stats");
	return res.data.data;
}

export async function listOverdueDeliveries() {
	const res = await apiClient.get<ApiSuccess<OverdueDelivery[]>>(
		"/deliveries/overdue",
	);
	return res.data.data;
}

/**
 * `start` WAJIB hari Senin dan `end` WAJIB hari Minggu tepat 6 hari sesudahnya —
 * kalau tidak server membalas 400. `days` di hasilnya selalu 7 elemen.
 */
export async function listWeeklyDeliveries(params: {
	start: string;
	end: string;
}) {
	const res = await apiClient.get<ApiSuccess<WeeklyDeliveries>>("/deliveries", {
		params,
	});
	return res.data.data;
}
