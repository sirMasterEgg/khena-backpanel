import { Group, Menu } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import { StatusBadge } from "@/components/StatusBadge";
import type { OrderStatus } from "./orderTypes";

/** Semua status yang bisa dipilih dari dropdown. */
const STATUS_OPTIONS: OrderStatus[] = [
	"pending",
	"processing",
	"shipped",
	"completed",
	"cancelled",
];

interface StatusMenuProps {
	status: OrderStatus;
	onChange: (status: OrderStatus) => void;
}

/** Badge status yang bisa diklik → dropdown untuk mengganti status order. */
export function StatusMenu({ status, onChange }: StatusMenuProps) {
	return (
		<Menu shadow="md" position="bottom-start" withinPortal>
			<Menu.Target>
				{/* stopPropagation supaya klik badge tidak membuka detail baris. */}
				<Group
					gap={4}
					wrap="nowrap"
					style={{ cursor: "pointer", display: "inline-flex" }}
					onClick={(e) => e.stopPropagation()}
				>
					<StatusBadge status={status} />
					<IconChevronDown size={14} color="var(--mantine-color-dimmed)" />
				</Group>
			</Menu.Target>
			<Menu.Dropdown onClick={(e) => e.stopPropagation()}>
				<Menu.Label>Change status</Menu.Label>
				{STATUS_OPTIONS.map((option) => (
					<Menu.Item
						key={option}
						disabled={option === status}
						onClick={() => onChange(option)}
					>
						<StatusBadge status={option} variant="light" />
					</Menu.Item>
				))}
			</Menu.Dropdown>
		</Menu>
	);
}
