export type CustomerOrder = {
	id: string; // mis. "ORD-1042"
	date: string; // ISO date
	total: number; // Rupiah mentah
	status: "processing" | "shipped" | "pending" | "completed" | "cancelled";
};

/**
 * Hasilkan daftar order dummy untuk satu customer secara deterministik
 * berdasarkan `totalOrders`. Kalau totalOrders 0 → array kosong (untuk empty state).
 * Total tiap order kira-kira lifetimeValue dibagi rata; status berselang-seling.
 *
 * TODO: modul order belum ada di contract.md — data di bawah masih DUMMY.
 * Ganti dengan GET /api/orders?customerId=... begitu endpoint-nya tersedia.
 */
export function getCustomerOrders(input: {
	id: string;
	totalOrders: number;
	lifetimeValue: number;
	joinedAt: string;
}): CustomerOrder[] {
	if (input.totalOrders <= 0) return [];
	const statuses = ["completed", "shipped", "processing", "pending"] as const;
	const per = Math.round(input.lifetimeValue / input.totalOrders);
	return Array.from({ length: input.totalOrders }, (_, i) => ({
		id: `ORD-${input.id}${String(i + 1).padStart(3, "0")}`,
		date: input.joinedAt,
		total: per,
		status: statuses[i % statuses.length],
	}));
}
