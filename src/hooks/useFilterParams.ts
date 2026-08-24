import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";

type ParamValue = string | number;
type ParamDefaults = Record<string, ParamValue>;

/**
 * Menyimpan state filter di query string, bukan di useState.
 *
 * - Nilai yang sama dengan default otomatis dihapus dari URL (URL tetap bersih).
 * - Mengubah param apa pun selain `page` otomatis mereset `page` ke default.
 * - Default-nya push ke history; pakai `{ replace: true }` HANYA untuk input search.
 *
 * @example
 * const [filters, setFilters] = useFilterParams({ q: "", status: "all", page: 1 });
 * setFilters({ status: "shipped" });            // push, page ikut ter-reset
 * setFilters({ q: "sofa" }, { replace: true }); // khusus search
 */
export function useFilterParams<T extends ParamDefaults>(defaults: T) {
	const [searchParams, setSearchParams] = useSearchParams();

	// `defaults` ditulis inline di komponen jadi identitasnya berubah tiap render;
	// yang relevan hanya searchParams.
	// biome-ignore lint/correctness/useExhaustiveDependencies: <lihat komentar di atas>
	const values = useMemo(() => {
		const result = {} as T;
		for (const key of Object.keys(defaults) as (keyof T & string)[]) {
			const raw = searchParams.get(key);
			const fallback = defaults[key];
			if (raw === null || raw === "") {
				result[key] = fallback;
				continue;
			}
			if (typeof fallback === "number") {
				const parsed = Number(raw);
				// URL bisa diketik manual/rusak — jangan sampai NaN masuk ke queryKey.
				result[key] = (
					Number.isFinite(parsed) ? parsed : fallback
				) as T[keyof T & string];
			} else {
				result[key] = raw as T[keyof T & string];
			}
		}
		return result;
	}, [searchParams]);

	// `defaults` ditulis inline di komponen jadi identitasnya berubah tiap render;
	// yang relevan hanya setSearchParams.
	// biome-ignore lint/correctness/useExhaustiveDependencies: <lihat komentar di atas>
	const setValues = useCallback(
		(patch: Partial<T>, options?: { replace?: boolean }) => {
			setSearchParams(
				(prev) => {
					const next = new URLSearchParams(prev);

					// Aturan 2.4: ganti filter apa pun => balik ke halaman 1.
					const touchesNonPage = Object.keys(patch).some((k) => k !== "page");
					if (touchesNonPage && "page" in defaults) next.delete("page");

					for (const [key, value] of Object.entries(patch)) {
						// Aturan 2.3: nilai default tidak ditulis ke URL.
						if (
							value === undefined ||
							value === "" ||
							value === defaults[key]
						) {
							next.delete(key);
						} else {
							next.set(key, String(value));
						}
					}
					return next;
				},
				{ replace: options?.replace ?? false },
			);
		},
		[setSearchParams],
	);

	return [values, setValues] as const;
}
