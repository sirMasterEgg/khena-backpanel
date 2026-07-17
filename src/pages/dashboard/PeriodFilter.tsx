import { DatePickerInput } from "@mantine/dates";
import { IconCalendar } from "@tabler/icons-react";
import { type DateRange, rangeForPeriod } from "./dashboardData";

/** Preset/suggestion di kalender: minggu, bulan, kuartal, tahun berjalan. */
const presets: { value: [string, string]; label: string }[] = [
	{ value: rangeForPeriod("week"), label: "This week" },
	{ value: rangeForPeriod("month"), label: "This month" },
	{ value: rangeForPeriod("year"), label: "This year" },
];

interface PeriodFilterProps {
	value: DateRange;
	onChange: (value: DateRange) => void;
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
	return (
		<DatePickerInput
			type="range"
			value={value}
			onChange={onChange}
			presets={presets}
			leftSection={<IconCalendar size={16} />}
			valueFormat="MMM D, YYYY"
			placeholder="Pick date range"
			allowSingleDateInRange
			w={280}
		/>
	);
}
