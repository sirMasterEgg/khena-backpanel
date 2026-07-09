import { Badge } from "@mantine/core";
import type { CustomerSegment } from "@/data/dummy";

const segmentConfig: Record<CustomerSegment, { color: string; label: string }> =
	{
		vip: { color: "grape", label: "VIP" },
		loyal: { color: "blue", label: "Loyal" },
		new: { color: "teal", label: "New" },
		regular: { color: "gray", label: "Regular" },
	};

interface SegmentBadgeProps {
	segment: CustomerSegment;
}

/** Badge berwarna dengan titik (dot) untuk kolom Segment. */
export function SegmentBadge({ segment }: SegmentBadgeProps) {
	const config = segmentConfig[segment];
	return (
		<Badge
			color={config.color}
			variant="light"
			leftSection={
				<span
					style={{
						display: "inline-block",
						width: 6,
						height: 6,
						borderRadius: "50%",
						backgroundColor: `var(--mantine-color-${config.color}-6)`,
					}}
				/>
			}
		>
			{config.label}
		</Badge>
	);
}
