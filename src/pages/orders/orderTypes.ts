// Tipe untuk halaman Orders.

export type OrderStatus =
	| "pending"
	| "processing"
	| "shipped"
	| "completed"
	| "cancelled";

export type OrderItem = {
	productName: string;
	thumbnail: string; // URL gambar, mis. https://placehold.co/40x40
	qty: number;
};

export type Order = {
	id: string; // mis. "ORD-1042"
	customerName: string;
	customerAvatarColor: string; // untuk avatar inisial, mis. "teal"
	items: OrderItem[]; // minimal 1
	date: string; // ISO date, mis. "2026-07-10"
	total: number; // Rupiah mentah
	status: OrderStatus;
	hasDataIssue?: boolean; // true → tampilkan flag/ikon peringatan di kolom Order
};
