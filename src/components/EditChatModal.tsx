import { Button, Modal, Stack, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { cloneElement, useEffect, useState, type ReactNode } from "react";
import { Frame } from "./Chats";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function EditChatModal({
	chat,
	children,
}: {
	chat: Frame;
	children: ReactNode;
}) {
	const [opened, { open, close }] = useDisclosure(false);
	const [submitting, setSubmitting] = useState(false);

	const [value, setValue] = useState("");
	useEffect(() => {
		setValue(chat?.label ?? "New chat");
	}, [chat]);

	const settings = JSON.parse(localStorage.getItem("settings") || "{}");
	const queryClient = useQueryClient();

	const updateMutation = useMutation({
		mutationFn: async ({ value }: { value: string }) =>
			await fetch(`${settings.jivasHost}/walker/update_frame`, {
				method: "POST",
				body: JSON.stringify({
					agent_id: settings.jivasAgent,
					session_id: chat.session_id,
					label: value,
				}),
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${settings.token}`,
				},
			}),
		onSuccess: () => {
			// Invalidate and refetch
			queryClient.invalidateQueries({ queryKey: ["frames"] });
		},
	});

	return (
		<>
			{cloneElement(children, { onClick: open })}
			<Modal opened={opened} onClose={close} title="Edit Chat" withinPortal>
				<form
					onSubmit={async (event) => {
						try {
							await updateMutation.mutateAsync({ value });
							event.preventDefault();
							notifications.show({
								title: "Saved",
								message: "",
							});
							close();
						} catch (error: any) {
							if (error.toJSON().message === "Network Error") {
								notifications.show({
									title: "Error",
									color: "red",
									message: "No internet connection.",
								});
							}
							const message = error.response?.data?.error?.message;
							if (message) {
								notifications.show({
									title: "Error",
									color: "red",
									message,
								});
							}
						}
					}}
				>
					<Stack>
						<TextInput
							label="Name"
							value={value}
							onChange={(event) => setValue(event.currentTarget.value)}
							formNoValidate
							data-autofocus
						/>
						<Button type="submit" loading={updateMutation.status === "pending"}>
							Save
						</Button>
					</Stack>
				</form>
			</Modal>
		</>
	);
}
