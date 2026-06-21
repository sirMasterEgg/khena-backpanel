import { useDocumentTitle } from "@mantine/hooks";
import { APP_NAME } from "@/config/constants";

/**
 * Set judul tab browser secara dinamis.
 * @param title Judul halaman, contoh "Home". Hasil akhir: "Home — Khena Backpanel".
 */
export function usePageTitle(title: string) {
	useDocumentTitle(title ? `${title} — ${APP_NAME}` : APP_NAME);
}
