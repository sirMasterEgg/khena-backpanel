import type { Customer } from "@/data/dummy";

export type CustomerOrder = {
	id: string; // mis. "ORD-1042"
	date: string; // ISO date
	total: number; // Rupiah mentah
	status: "processing" | "shipped" | "pending" | "completed" | "cancelled";
};

/**
 * Hasilkan daftar order dummy untuk satu customer secara deterministik
 * berdasarkan `ordersCount`. Kalau ordersCount 0 → array kosong (untuk empty state).
 * Total tiap order kira-kira lifetimeValue dibagi rata; status berselang-seling.
 */
export function getCustomerOrders(customer: Customer): CustomerOrder[] {
	if (customer.ordersCount <= 0) return [];
	const statuses = ["completed", "shipped", "processing", "pending"] as const;
	const per = Math.round(customer.lifetimeValue / customer.ordersCount);
	return Array.from({ length: customer.ordersCount }, (_, i) => ({
		id: `ORD-${customer.id}${String(i + 1).padStart(3, "0")}`,
		date: customer.lastOrderAt ?? customer.joinedAt,
		total: per,
		status: statuses[i % statuses.length],
	}));
}
