import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiErrorCode } from "@/api/client";
import {
	createPage,
	listPages,
	type PageFilePart,
	type PageRow,
	type PageStatus,
	updatePage,
} from "@/api/pages";

export type UpsertSectionArgs = {
	existingId: string | undefined;
	page: string;
	section: string;
	status: PageStatus;
	data: unknown;
	files: PageFilePart[];
};

/**
 * Upsert 1 row `pages`. Database mulai kosong — row lahir saat user pertama
 * kali menekan Save (POST); setelahnya edit lewat PATCH.
 */
async function upsertSection(args: UpsertSectionArgs): Promise<PageRow> {
	if (args.existingId) {
		// Gotcha #9: kirim `files` tanpa `data` = error. Di sini `data` selalu ikut.
		return updatePage(args.existingId, {
			status: args.status,
			data: args.data,
			files: args.files,
		});
	}
	try {
		return await createPage({
			page: args.page,
			section: args.section,
			status: args.status,
			data: args.data,
			files: args.files,
		});
	} catch (err) {
		// Row ternyata sudah ada (cache basi / dibuat admin lain).
		// error.code = "CONFLICT", message "page section already exists".
		if (getApiErrorCode(err) !== "CONFLICT") throw err;
		const [existing] = await listPages({
			page: args.page,
			section: args.section,
		});
		if (!existing) throw err;
		return updatePage(existing.id, {
			status: args.status,
			data: args.data,
			files: args.files,
		});
	}
}

/**
 * Query + mutation upsert untuk menu Pages. Mengambil SEMUA row sekaligus
 * (maksimal 11 row, murah) supaya badge jumlah di tab langsung terisi tanpa
 * 7 request terpisah. Pola React Query mengikuti
 * src/pages/collections/CollectionEditor.tsx.
 */
export function usePagesApi(options?: { enabled?: boolean }) {
	const queryClient = useQueryClient();

	const {
		data: rows = [],
		isLoading,
		isError,
		error,
		refetch,
	} = useQuery({
		queryKey: ["pages"],
		queryFn: () => listPages(),
		enabled: options?.enabled ?? true,
	});

	const findRow = (page: string, section: string) =>
		rows.find((r) => r.page === page && r.section === section);

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: ["pages"] });

	const saveMutation = useMutation({
		mutationFn: upsertSection,
		onSuccess: invalidate,
	});

	/** Toggle publish: HANYA kirim `status`, jangan ikut `data` (gotcha #8). */
	const toggleStatusMutation = useMutation({
		mutationFn: ({ id, status }: { id: string; status: PageStatus }) =>
			updatePage(id, { status }),
		onSuccess: invalidate,
	});

	return {
		rows,
		isLoading,
		isError,
		error,
		refetch,
		findRow,
		saveMutation,
		toggleStatusMutation,
	};
}
