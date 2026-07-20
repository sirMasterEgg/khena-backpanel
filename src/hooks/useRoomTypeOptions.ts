import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { listRoomTypes } from "@/api/roomTypes";

/**
 * Opsi room type untuk `<Select>` (value = id, label = nama) plus map id → nama
 * untuk menampilkan kolom Room Type di tabel category.
 *
 * TODO(konfirmasi): `limit: 100` mengasumsikan jumlah room type sedikit. Kalau
 * nanti lebih dari itu, ganti ke searchable/async select.
 */
export function useRoomTypeOptions() {
	const { data, isLoading } = useQuery({
		queryKey: ["room-types"],
		queryFn: () => listRoomTypes({ limit: 100 }),
	});

	const options = useMemo(
		() => data?.data.map((rt) => ({ value: rt.id, label: rt.roomType })) ?? [],
		[data],
	);

	const nameById = useMemo(
		() => new Map(options.map((o) => [o.value, o.label])),
		[options],
	);

	return { options, nameById, isLoading };
}
