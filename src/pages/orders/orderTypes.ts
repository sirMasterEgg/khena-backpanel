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
	sku?: string; // mis. "SOFA-001"
	unitPrice?: number; // harga satuan (Rupiah)
	costPrice?: number; // harga modal per item — untuk hitung profit (opsional)
	packed?: boolean; // status packing item (default false)
};

export type OrderCustomer = {
	id?: string | number; // untuk link ke /customers/:id
	name: string;
	email: string;
	phone?: string;
	totalSpend?: number;
};

export type OrderShipping = {
	recipient: string;
	addressLines: string[]; // tiap baris alamat satu string
	province?: string;
	postCode?: string;
	tracking?: string;
};

export type OrderDelivery = {
	date?: string; // ISO date
	timeSlot?: string; // mis. "09:00 - 12:00"
	notes?: string; // driver / catatan pengiriman
	deliveredAt?: string; // ISO date; ada → sudah terkirim
};

export type Order = {
	id: string; // mis. "ORD-1042"
	customerName: string;
	customerAvatarColor: string; // untuk avatar inisial, mis. "teal"
	items: OrderItem[]; // minimal 1
	date: string; // ISO date, mis. "2026-07-10" — dipakai sebagai tanggal "Placed"
	total: number; // Rupiah mentah
	status: OrderStatus;
	hasDataIssue?: boolean; // true → tampilkan flag/ikon peringatan di kolom Order
	// Field detail (opsional) — dipakai halaman /orders/:id.
	subtotal?: number; // total sebelum ongkir
	shipping?: number; // ongkos kirim
	customer?: OrderCustomer;
	shippingInfo?: OrderShipping;
	delivery?: OrderDelivery;
	notes?: string;
	dataIssues?: string[]; // daftar masalah data; dipakai banner peringatan
};
