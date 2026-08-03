import type { CustomerSegment } from "@/api/customers";

/**
 * Customer yang sedang dipilih di layar POS / Order Sales. Sengaja tipe
 * minimal karena datang dari 2 sumber: hasil GET /customers (punya
 * `segment`) atau hasil POST /customers (tanpa `segment`).
 */
export type PickedCustomer = {
	id: string;
	name: string;
	phone: string;
	segment?: CustomerSegment;
};
