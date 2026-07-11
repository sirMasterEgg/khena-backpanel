import type { BadgeProps } from "@mantine/core";
import { Badge } from "@mantine/core";

interface StatusBadgeProps extends Omit<BadgeProps, "color"> {
	status:
		| "published"
		| "draft"
		| "scheduled"
		| "archived"
		| "active"
		| "inactive"
		| "processing"
		| "shipped"
		| "pending"
		| "completed"
		| "cancelled"
		| "refunded"
		| "lowstock"
		| "outofstock"
		| "read"
		| "unread"
		| "ordered"
		| "partial"
		| "received"
		| "expired";
	children?: string;
}

export function StatusBadge({ status, children, ...props }: StatusBadgeProps) {
	const statusConfig: Record<string, { color: string; label: string }> = {
		published: { color: "green", label: "Published" },
		draft: { color: "gray", label: "Draft" },
		scheduled: { color: "blue", label: "Scheduled" },
		archived: { color: "gray", label: "Archived" },
		active: { color: "green", label: "Active" },
		inactive: { color: "gray", label: "Inactive" },
		processing: { color: "blue", label: "Processing" },
		shipped: { color: "blue", label: "Shipped" },
		pending: { color: "yellow", label: "Pending" },
		completed: { color: "green", label: "Completed" },
		cancelled: { color: "red", label: "Cancelled" },
		refunded: { color: "red", label: "Refunded" },
		lowstock: { color: "yellow", label: "Low Stock" },
		outofstock: { color: "red", label: "Out of Stock" },
		read: { color: "gray", label: "Read" },
		unread: { color: "blue", label: "Unread" },
		ordered: { color: "blue", label: "Ordered" },
		partial: { color: "yellow", label: "Partial" },
		received: { color: "green", label: "Received" },
		expired: { color: "red", label: "Expired" },
	};

	const config = statusConfig[status];

	return (
		<Badge color={config.color} {...props}>
			{children || config.label}
		</Badge>
	);
}
