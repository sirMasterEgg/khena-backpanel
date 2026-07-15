// Data dummy zona pengiriman untuk halaman Create Order.
// Belum ada backend ongkir, jadi tarif diambil dari daftar statis di bawah.

export type ShippingZone = {
	name: string; // nama zona, mis. "Jabodetabek"
	cities: string[]; // kota yang masuk zona ini (lowercase saat matching)
	etaDays: string; // estimasi hari, mis. "1-2 hari"
	baseRate: number; // tarif dasar (IDR)
};

export const shippingZones: ShippingZone[] = [
	{
		name: "Jabodetabek",
		cities: ["Jakarta", "Bekasi", "Bogor", "Depok", "Tangerang"],
		etaDays: "1-2 hari",
		baseRate: 50_000,
	},
	{ name: "Jawa Barat", cities: ["Bandung"], etaDays: "2-3 hari", baseRate: 90_000 },
	{
		name: "Jawa Tengah",
		cities: ["Semarang", "Yogyakarta", "Solo"],
		etaDays: "3-4 hari",
		baseRate: 120_000,
	},
	{
		name: "Jawa Timur",
		cities: ["Surabaya", "Malang"],
		etaDays: "3-4 hari",
		baseRate: 140_000,
	},
	{
		name: "Luar Jawa",
		cities: ["Medan", "Denpasar", "Makassar", "Palembang"],
		etaDays: "5-7 hari",
		baseRate: 250_000,
	},
];

// Default kalau kota tak dikenali.
const FALLBACK_ZONE: ShippingZone = {
	name: "Lainnya",
	cities: [],
	etaDays: "5-7 hari",
	baseRate: 200_000,
};

/** Cari zona berdasarkan nama kota (case-insensitive). */
export function getShippingZoneByCity(city: string): ShippingZone {
	const q = city.trim().toLowerCase();
	if (!q) return FALLBACK_ZONE;
	return (
		shippingZones.find((z) => z.cities.some((c) => c.toLowerCase() === q)) ??
		FALLBACK_ZONE
	);
}

/** Daftar kota untuk saran (autocomplete) — gabungan semua zona, unik & terurut. */
export const knownCities: string[] = [
	...new Set(shippingZones.flatMap((z) => z.cities)),
].sort();

/** Daftar provinsi untuk saran (autocomplete) pada shipping address. */
export const knownProvinces: string[] = [
	"Bali",
	"Banten",
	"DI Yogyakarta",
	"DKI Jakarta",
	"Jawa Barat",
	"Jawa Tengah",
	"Jawa Timur",
	"Kalimantan Timur",
	"Sulawesi Selatan",
	"Sumatera Selatan",
	"Sumatera Utara",
];
