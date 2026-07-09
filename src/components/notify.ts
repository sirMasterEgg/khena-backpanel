import { notifications } from "@mantine/notifications";

/**
 * Wrapper tipis di atas `@mantine/notifications` supaya pemanggilan seragam
 * (`notify.success(...)` / `notify.error(...)`) dan bisa dipanggil dari mana
 * saja, termasuk callback di luar komponen.
 */
export const notify = {
	success: (message: string, title = "Berhasil") =>
		notifications.show({ message, title, color: "green" }),
	error: (message: string, title = "Gagal") =>
		notifications.show({ message, title, color: "red" }),
	info: (message: string, title?: string) =>
		notifications.show({ message, title, color: "blue" }),
};
