import { Badge, Button, Container, Tabs } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { listAdministrators } from "@/api/administrators";
import { listRoles } from "@/api/roles";
import { PageHeader } from "@/components/PageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";
import { usePermissions } from "@/hooks/usePermissions";
import { RolesTab } from "./RolesTab";
import { UsersTab } from "./UsersTab";

type UsersRolesTab = "users" | "roles";

export function UsersRolesPage() {
	usePageTitle("Users & Roles");
	const { can } = usePermissions();
	const navigate = useNavigate();
	const { tab: tabParam } = useParams();

	const tab: UsersRolesTab = tabParam === "roles" ? "roles" : "users";
	const [userFormOpened, setUserFormOpened] = useState(false);
	const [roleFormOpened, setRoleFormOpened] = useState(false);

	const canReadRoles = can("role.read");

	useEffect(() => {
		// Cegah akses langsung ke /settings/users/roles tanpa permission.
		if (tab === "roles" && !canReadRoles) {
			navigate("/settings/users", { replace: true });
		}
	}, [tab, canReadRoles, navigate]);

	const usersCountQuery = useQuery({
		queryKey: ["administrators", { page: 1, limit: 1 }],
		queryFn: () => listAdministrators({ page: 1, limit: 1 }),
	});
	const rolesCountQuery = useQuery({
		queryKey: ["roles", { page: 1, limit: 1 }],
		queryFn: () => listRoles({ page: 1, limit: 1 }),
		enabled: canReadRoles,
	});

	const usersTotal = usersCountQuery.data?.meta.total;
	const rolesTotal = rolesCountQuery.data?.meta.total;

	const canAddUser = can("administrator.create") && can("role.read");
	const canAddRole = can("role.create");

	const actions =
		tab === "users"
			? canAddUser && (
					<Button
						leftSection={<IconPlus size={16} />}
						onClick={() => setUserFormOpened(true)}
					>
						Add User
					</Button>
				)
			: canAddRole && (
					<Button
						leftSection={<IconPlus size={16} />}
						onClick={() => setRoleFormOpened(true)}
					>
						Add Role
					</Button>
				);

	return (
		<Container size="xl">
			<PageHeader
				title="Users & Roles"
				subtitle="Manage admin accounts and their access levels"
				actions={actions}
			/>

			<Tabs
				value={tab}
				onChange={(val) =>
					navigate(
						val === "roles" ? "/settings/users/roles" : "/settings/users",
					)
				}
			>
				<Tabs.List mb="md">
					<Tabs.Tab
						value="users"
						rightSection={
							usersTotal !== undefined ? (
								<Badge size="sm" variant="light">
									{usersTotal}
								</Badge>
							) : undefined
						}
					>
						Users
					</Tabs.Tab>
					{canReadRoles && (
						<Tabs.Tab
							value="roles"
							rightSection={
								rolesTotal !== undefined ? (
									<Badge size="sm" variant="light">
										{rolesTotal}
									</Badge>
								) : undefined
							}
						>
							Roles
						</Tabs.Tab>
					)}
				</Tabs.List>

				<Tabs.Panel value="users">
					<UsersTab
						formOpened={userFormOpened}
						onFormOpenedChange={setUserFormOpened}
					/>
				</Tabs.Panel>
				{canReadRoles && (
					<Tabs.Panel value="roles">
						<RolesTab
							formOpened={roleFormOpened}
							onFormOpenedChange={setRoleFormOpened}
						/>
					</Tabs.Panel>
				)}
			</Tabs>
		</Container>
	);
}
