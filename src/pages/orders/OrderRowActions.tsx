import { ActionIcon, Menu, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import {
	IconArrowBackUp,
	IconCircleCheck,
	IconDots,
	IconEye,
	IconPrinter,
	IconTruck,
} from "@tabler/icons-react";
import { notify } from "@/components/notify";
import { canRefund } from "@/config/permissions";
import type { Order, OrderStatus } from "./orderTypes";

interface OrderRowActionsProps {
	order: Order;
	onView: () => void;
	onChangeStatus: (status: OrderStatus) => void;
	onRefund: () => void;
}

/** Menu titik-tiga per baris order. */
export function OrderRowActions({
	order,
	onView,
	onChangeStatus,
	onRefund,
}: OrderRowActionsProps) {
	const handleRefund = () => {
		modals.openConfirmModal({
			title: "Refund order",
			centered: true,
			children: (
				<Text size="sm">
					Are you sure you want to refund order #{order.id}? This action can't
					be undone.
				</Text>
			),
			labels: { confirm: "Refund", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: () => {
				onRefund();
				notify.success(`#${order.id} refunded`, "Order refunded");
			},
		});
	};

	return (
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

				{/* Aksi ubah status yang relevan dengan status saat ini. */}
				{(order.status === "pending" || order.status === "processing") && (
					<Menu.Item
						leftSection={<IconTruck size={16} />}
						onClick={() => onChangeStatus("shipped")}
					>
						Mark as Shipped
					</Menu.Item>
				)}
				{order.status === "shipped" && (
					<Menu.Item
						leftSection={<IconCircleCheck size={16} />}
						onClick={() => onChangeStatus("completed")}
					>
						Mark as Completed
					</Menu.Item>
				)}

				<Menu.Divider />
				<Menu.Item
					leftSection={<IconPrinter size={16} />}
					onClick={() =>
						notify.info("Print label belum tersedia", "Print label")
					}
				>
					Print label
				</Menu.Item>
				<Menu.Item
					leftSection={<IconPrinter size={16} />}
					onClick={() =>
						notify.info("Print invoice belum tersedia", "Print invoice")
					}
				>
					Print invoice
				</Menu.Item>

				{canRefund && (
					<>
						<Menu.Divider />
						<Menu.Item
							color="red"
							leftSection={<IconArrowBackUp size={16} />}
							onClick={handleRefund}
						>
							Refund
						</Menu.Item>
					</>
				)}
			</Menu.Dropdown>
		</Menu>
	);
}
