// Validasi kontak customer, dipakai di seluruh form yang menginput customer
// (Add/Edit customer, New customer di Order Sales, dst.).

/** Validasi format email sederhana. */
export function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validasi nomor HP: 8–15 digit, boleh diawali "+" dan boleh memakai
 * spasi/tanda hubung/kurung sebagai pemisah. Mis. "0812-3456-7890",
 * "+62 812 3456 7890". Input non-angka seperti "abc" ditolak.
 */
export function isValidPhone(phone: string): boolean {
	const cleaned = phone.replace(/[\s\-()]/g, "");
	return /^\+?\d{8,15}$/.test(cleaned);
}
