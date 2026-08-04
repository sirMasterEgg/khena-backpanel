import { ActionIcon, Menu, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import {
	IconBan,
	IconCircleCheck,
	IconDots,
	IconEye,
	IconPrinter,
	IconSettings,
	IconTruck,
} from "@tabler/icons-react";
import { useState } from "react";
import {
	ALLOWED_STATUS_TRANSITIONS,
	type OrderSalesListItem,
	type OrderSalesStatus,
} from "@/api/orderSales";
import { canRefund } from "@/config/permissions";
import { PrintDocumentModal } from "./PrintDocumentModal";

interface OrderRowActionsProps {
	order: OrderSalesListItem;
	onView: () => void;
	onChangeStatus: (status: OrderSalesStatus) => void;
	/** Membatalkan order (PATCH /:id/status → cancelled). */
	onCancel: () => void;
}

/** Label & ikon tombol aksi untuk tiap status TUJUAN (bukan status saat ini). */
const STATUS_ACTIONS: Record<
	Exclude<OrderSalesStatus, "cancelled">,
	{ label: string; icon: typeof IconTruck }
> = {
	pending: { label: "Mark as pending", icon: IconSettings },
	processing: { label: "Start processing", icon: IconSettings },
	shipped: { label: "Mark as shipped", icon: IconTruck },
	completed: { label: "Mark as completed", icon: IconCircleCheck },
};

/** Menu titik-tiga per baris order. */
export function OrderRowActions({
	order,
	onView,
	onChangeStatus,
	onCancel,
}: OrderRowActionsProps) {
	const [printKind, setPrintKind] = useState<"invoice" | "label" | null>(null);

	const transitions = ALLOWED_STATUS_TRANSITIONS[order.status];
	const canCancel = transitions.includes("cancelled");

	const handleCancel = () => {
		modals.openConfirmModal({
			title: "Cancel order",
			centered: true,
			children: (
				<Text size="sm">
					Are you sure you want to cancel order #{order.invoiceNumber}? Stock
					will be returned to inventory. This action can't be undone.
				</Text>
			),
			labels: { confirm: "Cancel order", cancel: "Back" },
			confirmProps: { color: "red" },
			onConfirm: onCancel,
		});
	};

	return (
		<>
			<Menu shadow="md" position="bottom-end" withinPortal>
				<Menu.Target>
					<ActionIcon
						variant="subtle"
						color="gray"
						onClick={(e) => e.stopPropagation()}
					>
						<IconDots size={16} />
					</ActionIcon>
				</Menu.Target>
				<Menu.Dropdown onClick={(e) => e.stopPropagation()}>
					<Menu.Item leftSection={<IconEye size={16} />} onClick={onView}>
						View details
					</Menu.Item>

					{/* Aksi ubah status yang diizinkan dari status saat ini (selain cancel). */}
					{transitions
						.filter((status) => status !== "cancelled")
						.map((status) => {
							const { label, icon: Icon } = STATUS_ACTIONS[status];
							return (
								<Menu.Item
									key={status}
									leftSection={<Icon size={16} />}
									onClick={() => onChangeStatus(status)}
								>
									{label}
								</Menu.Item>
							);
						})}

					<Menu.Divider />
					<Menu.Item
						leftSection={<IconPrinter size={16} />}
						onClick={() => setPrintKind("label")}
					>
						Print label
					</Menu.Item>
					<Menu.Item
						leftSection={<IconPrinter size={16} />}
						onClick={() => setPrintKind("invoice")}
					>
						Print invoice
					</Menu.Item>

					{canRefund && canCancel && (
						<>
							<Menu.Divider />
							<Menu.Item
								color="red"
								leftSection={<IconBan size={16} />}
								onClick={handleCancel}
							>
								Cancel order
							</Menu.Item>
						</>
					)}
				</Menu.Dropdown>
			</Menu>

			<PrintDocumentModal
				opened={printKind !== null}
				onClose={() => setPrintKind(null)}
				kind={printKind ?? "invoice"}
				orderIds={[order.id]}
			/>
		</>
	);
}
