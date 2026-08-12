import { zodResolver } from "@hookform/resolvers/zod";
import {
	Anchor,
	Breadcrumbs,
	Button,
	Card,
	Center,
	Container,
	Group,
	Loader,
	Radio,
	Select,
	Stack,
	Text,
	Textarea,
	TextInput,
} from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { getApiErrorMessage } from "@/api/client";
import {
	createJob,
	getJob,
	type JobInput,
	type JobUpdateInput,
	updateJob,
} from "@/api/jobs";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { useJobMasterOptions } from "@/hooks/useJobMasterOptions";
import { usePageTitle } from "@/hooks/usePageTitle";
import { usePermissions } from "@/hooks/usePermissions";
import { type JobFormData, jobSchema } from "./jobSchema";

export function JobEditor() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { id } = useParams();
	const isEdit = Boolean(id);
	const { can } = usePermissions();
	const canSave = isEdit ? can("job.update") : can("job.create");

	usePageTitle(isEdit ? "Edit Position" : "Add Position");

	const { data: job, isLoading } = useQuery({
		queryKey: ["jobs", id],
		queryFn: () => getJob(id as string),
		enabled: isEdit,
	});

	const { departmentOptions, employmentTypeOptions } = useJobMasterOptions();

	// `values` (bukan `defaultValues`) supaya form ikut ter-update saat data detail datang.
	const values = useMemo<JobFormData | undefined>(
		() =>
			job
				? {
						jobTitle: job.jobTitle,
						departmentId: job.department.id,
						location: job.location,
						employmentTypeId: job.employmentType.id,
						status: job.status,
						roleDescription: job.roleDescription,
						requirements: job.requirements,
						benefits: job.benefits ?? "",
					}
				: undefined,
		[job],
	);

	const {
		control,
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<JobFormData>({
		resolver: zodResolver(jobSchema),
		defaultValues: {
			jobTitle: "",
			departmentId: "",
			location: "",
			employmentTypeId: "",
			status: "draft",
			roleDescription: "",
			requirements: "",
			benefits: "",
		},
		values,
	});

	const mutation = useMutation({
		mutationFn: (body: JobInput | JobUpdateInput) =>
			isEdit ? updateJob(id as string, body) : createJob(body as JobInput),
		onSuccess: () => {
			notify.success(isEdit ? "Position diperbarui" : "Position dibuat");
			queryClient.invalidateQueries({ queryKey: ["jobs"] });
			navigate("/jobs");
		},
		onError: (error) => notify.error(getApiErrorMessage(error)),
	});

	const onSubmit = (form: JobFormData) => {
		const benefits = form.benefits.trim();
		mutation.mutate({
			jobTitle: form.jobTitle,
			departmentId: form.departmentId,
			location: form.location,
			employmentTypeId: form.employmentTypeId,
			status: form.status,
			roleDescription: form.roleDescription,
			requirements: form.requirements,
			// Create: kosong → jangan kirim (server simpan null).
			// Edit: kosong → kirim null supaya nilai lama benar-benar dihapus.
			...(benefits ? { benefits } : isEdit ? { benefits: null } : {}),
		});
	};

	if (isEdit && isLoading) {
		return (
			<Container size="xl">
				<Center py="xl">
					<Loader />
				</Center>
			</Container>
		);
	}

	return (
		<Container size="xl">
			<Breadcrumbs mb="xs" separator="›">
				<Anchor size="sm" c="dimmed" onClick={() => navigate("/jobs")}>
					Team
				</Anchor>
				<Anchor size="sm" c="dimmed" onClick={() => navigate("/jobs")}>
					Jobs
				</Anchor>
				<Text size="sm" c="dimmed">
					{isEdit ? "Edit Position" : "Add Position"}
				</Text>
			</Breadcrumbs>

			<PageHeader
				title={isEdit ? "Edit Position" : "Add Position"}
				actions={
					<Group gap="sm">
						<Button
							type="button"
							variant="default"
							onClick={() => navigate("/jobs")}
						>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={handleSubmit(onSubmit)}
							loading={mutation.isPending}
							disabled={mutation.isPending || !canSave}
						>
							Save
						</Button>
					</Group>
				}
			/>

			<Card withBorder>
				<Stack gap="md">
					<TextInput
						label="Position title"
						placeholder="e.g., Backend Engineer"
						{...register("jobTitle")}
						error={errors.jobTitle?.message}
					/>

					<Controller
						name="departmentId"
						control={control}
						render={({ field }) => (
							<Select
								label="Department"
								placeholder="Select department"
								data={departmentOptions}
								value={field.value || null}
								onChange={(v) => field.onChange(v ?? "")}
								error={errors.departmentId?.message}
							/>
						)}
					/>

					<TextInput
						label="Location"
						placeholder="e.g., Jakarta"
						{...register("location")}
						error={errors.location?.message}
					/>

					<Controller
						name="employmentTypeId"
						control={control}
						render={({ field }) => (
							<Select
								label="Employment type"
								placeholder="Select employment type"
								data={employmentTypeOptions}
								value={field.value || null}
								onChange={(v) => field.onChange(v ?? "")}
								error={errors.employmentTypeId?.message}
							/>
						)}
					/>

					<Controller
						name="status"
						control={control}
						render={({ field }) => (
							<Radio.Group
								label="Status"
								value={field.value}
								onChange={field.onChange}
							>
								<Group gap="lg" mt="xs">
									<Radio value="open" label="Open" />
									<Radio value="closed" label="Closed" />
									<Radio value="draft" label="Draft" />
								</Group>
							</Radio.Group>
						)}
					/>

					<Textarea
						label="Role description"
						autosize
						minRows={4}
						{...register("roleDescription")}
						error={errors.roleDescription?.message}
					/>

					<Textarea
						label="Requirements"
						autosize
						minRows={4}
						{...register("requirements")}
						error={errors.requirements?.message}
					/>

					<Textarea
						label="Benefits (optional)"
						autosize
						minRows={3}
						{...register("benefits")}
						error={errors.benefits?.message}
					/>
				</Stack>
			</Card>
		</Container>
	);
}
