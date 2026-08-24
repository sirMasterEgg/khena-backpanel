import dayjs from "dayjs";

/** "2026-06-19" → "Updated 19 Jun 2026" */
export function formatUpdatedAt(date: string) {
	return `Updated ${dayjs(date).format("D MMM YYYY")}`;
}
