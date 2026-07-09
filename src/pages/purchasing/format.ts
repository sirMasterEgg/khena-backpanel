// Helper format untuk halaman Purchasing.
// Rupiah & tanggal memakai formatter yang sama dengan halaman Customers,
// jadi cukup di-re-export agar tidak menduplikasi implementasi.

export { formatCurrency, formatDate } from "@/pages/customers/format";
