import { Button, Menu } from "@mantine/core";
import { IconCalendar, IconChevronDown } from "@tabler/icons-react";
import dayjs from "dayjs";
import type { Period } from "./dashboardData";

const periodOptions: { value: Period; label: string }[] = [
	{ value: "week", label: "Week" },
	{ value: "month", label: "Month" },
	{ value: "quarter", label: "Quarter" },
	{ value: "year", label: "Year" },
];

/** Label periode aktif yang dihitung dari tanggal hari ini. */
function periodLabel(period: Period): string {
	const now = dayjs();
	switch (period) {
		case "week": {
			const start = now.startOf("week");
			const end = now.endOf("week");
			return `${start.format("MMM D, YYYY")} - ${end.format("MMM D, YYYY")}`;
		}
		case "month":
			return now.format("MMMM YYYY");
		case "quarter":
			return `Q${Math.floor(now.month() / 3) + 1} ${now.format("YYYY")}`;
		case "year":
			return now.format("YYYY");
	}
}

interface PeriodFilterProps {
	value: Period;
	onChange: (period: Period) => void;
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
	return (
		<Menu position="bottom-end" width={180}>
			<Menu.Target>
				<Button
					variant="default"
					leftSection={<IconCalendar size={16} />}
					rightSection={<IconChevronDown size={16} />}
				>
					{periodLabel(value)}
				</Button>
			</Menu.Target>
			<Menu.Dropdown>
				{periodOptions.map((opt) => (
					<Menu.Item
						key={opt.value}
						onClick={() => onChange(opt.value)}
						fw={opt.value === value ? 600 : undefined}
					>
						{opt.label}
					</Menu.Item>
				))}
			</Menu.Dropdown>
		</Menu>
	);
}
