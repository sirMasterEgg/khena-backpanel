import { Group, Menu } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import {
	ALLOWED_STATUS_TRANSITIONS,
	type OrderSalesStatus,
} from "@/api/orderSales";
import { StatusBadge } from "@/components/StatusBadge";

interface StatusMenuProps {
	status: OrderSalesStatus;
	onChange: (status: OrderSalesStatus) => void;
}

/** Badge status yang bisa diklik → dropdown untuk mengganti status order. */
export function StatusMenu({ status, onChange }: StatusMenuProps) {
	const options = ALLOWED_STATUS_TRANSITIONS[status];

	// Status terminal (completed/cancelled) tidak punya transisi keluar —
	// tampilkan badge polos tanpa dropdown.
	if (options.length === 0) {
		return <StatusBadge status={status} />;
	}

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
				{options.map((option) => (
					<Menu.Item key={option} onClick={() => onChange(option)}>
						<StatusBadge status={option} variant="light" />
					</Menu.Item>
				))}
			</Menu.Dropdown>
		</Menu>
	);
}
