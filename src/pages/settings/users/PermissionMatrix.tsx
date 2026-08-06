import { Checkbox, Group, ScrollArea, Table, Text } from "@mantine/core";
import { useMemo } from "react";
import type { Permission } from "@/api/permissions";

const ACTION_PRIORITY = ["create", "read", "update", "delete"];

function sortActions(actions: string[]) {
	return [...actions].sort((a, b) => {
		const ai = ACTION_PRIORITY.indexOf(a);
		const bi = ACTION_PRIORITY.indexOf(b);
		if (ai !== -1 && bi !== -1) return ai - bi;
		if (ai !== -1) return -1;
		if (bi !== -1) return 1;
		return a.localeCompare(b);
	});
}

interface PermissionMatrixProps {
	permissions: Permission[];
	value: string[];
	onChange: (next: string[]) => void;
}

export function PermissionMatrix({
	permissions,
	value,
	onChange,
}: PermissionMatrixProps) {
	const modules = useMemo(
		() => [...new Set(permissions.map((p) => p.module))].sort(),
		[permissions],
	);
	const actions = useMemo(
		() => sortActions([...new Set(permissions.map((p) => p.action))]),
		[permissions],
	);
	const codeByCell = useMemo(() => {
		const map = new Map<string, string>();
		for (const p of permissions) {
			map.set(`${p.module}.${p.action}`, p.code);
		}
		return map;
	}, [permissions]);

	const selected = new Set(value);
	const allCodes = permissions.map((p) => p.code);
	const allChecked =
		allCodes.length > 0 && allCodes.every((c) => selected.has(c));
	const someChecked = allCodes.some((c) => selected.has(c));

	const toggleAll = (checked: boolean) => {
		onChange(checked ? allCodes : []);
	};

	const toggleRow = (module: string, checked: boolean) => {
		const rowCodes = actions
			.map((action) => codeByCell.get(`${module}.${action}`))
			.filter((c): c is string => Boolean(c));
		const next = new Set(selected);
		for (const code of rowCodes) {
			if (checked) next.add(code);
			else next.delete(code);
		}
		onChange([...next]);
	};

	const toggleCell = (code: string, checked: boolean) => {
		const next = new Set(selected);
		if (checked) next.add(code);
		else next.delete(code);
		onChange([...next]);
	};

	return (
		<div>
			<Group justify="flex-end" mb="xs">
				<Checkbox
					label="Select all"
					checked={allChecked}
					indeterminate={someChecked && !allChecked}
					onChange={(e) => toggleAll(e.currentTarget.checked)}
				/>
			</Group>
			<ScrollArea.Autosize mah={360}>
				<Table withColumnBorders>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Module</Table.Th>
							{actions.map((action) => (
								<Table.Th key={action} style={{ textTransform: "capitalize" }}>
									{action}
								</Table.Th>
							))}
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{modules.map((module) => {
							const rowCodes = actions
								.map((action) => codeByCell.get(`${module}.${action}`))
								.filter((c): c is string => Boolean(c));
							const rowAllChecked =
								rowCodes.length > 0 && rowCodes.every((c) => selected.has(c));
							const rowSomeChecked = rowCodes.some((c) => selected.has(c));
							return (
								<Table.Tr key={module}>
									<Table.Td>
										<Group gap="xs" wrap="nowrap">
											<Checkbox
												checked={rowAllChecked}
												indeterminate={rowSomeChecked && !rowAllChecked}
												onChange={(e) =>
													toggleRow(module, e.currentTarget.checked)
												}
											/>
											<Text>{module}</Text>
										</Group>
									</Table.Td>
									{actions.map((action) => {
										const code = codeByCell.get(`${module}.${action}`);
										return (
											<Table.Td key={action}>
												{code ? (
													<Checkbox
														checked={selected.has(code)}
														onChange={(e) =>
															toggleCell(code, e.currentTarget.checked)
														}
													/>
												) : (
													<Text c="dimmed">—</Text>
												)}
											</Table.Td>
										);
									})}
								</Table.Tr>
							);
						})}
					</Table.Tbody>
				</Table>
			</ScrollArea.Autosize>
		</div>
	);
}
