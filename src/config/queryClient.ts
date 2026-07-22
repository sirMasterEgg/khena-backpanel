import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5,
			gcTime: 1000 * 60 * 10,
			retry: 1,
			refetchOnWindowFocus: false,
		},
		mutations: {
			// JANGAN di-retry. Write (POST/PUT/DELETE) tidak idempotent: kalau
			// backend sudah menulis data lalu membalas error, retry menghasilkan
			// baris duplikat — dan user cuma lihat SATU toast karena hanya
			// kegagalan terakhir yang sampai ke onError.
			retry: 0,
		},
	},
});
