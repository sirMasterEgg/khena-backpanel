// Saran (autocomplete) kota & provinsi untuk alamat kirim Create Order.
// Tarif ongkir dihitung server lewat Biteship — file ini HANYA berisi daftar
// nama untuk kemudahan pengetikan, bukan sumber tarif.

export const knownCities: string[] = [
	"Bandung",
	"Bekasi",
	"Bogor",
	"Denpasar",
	"Depok",
	"Jakarta",
	"Makassar",
	"Malang",
	"Medan",
	"Palembang",
	"Semarang",
	"Solo",
	"Surabaya",
	"Tangerang",
	"Yogyakarta",
].sort();

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
