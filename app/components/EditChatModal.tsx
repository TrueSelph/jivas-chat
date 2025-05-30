import { Button, Modal, Stack, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { cloneElement, useEffect, useState, type ReactNode } from "react";
// import { Frame } from "./Chats";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFetcher } from "react-router";
import type { Route } from "../routes/+types/chats";

export function EditChatModal({
	chat,
	children,
}: {
	chat: Route.ComponentProps["loaderData"]["frames"][0];
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

	const fetcher = useFetcher();

	return (
		<>
			{cloneElement(children, { onClick: open })}
			<Modal opened={opened} onClose={close} title="Edit Chat" withinPortal>
				<form
					onSubmit={async (event) => {
						try {
							fetcher.submit(
								{
									_action: "updateFrame",
									label: value,
									sessionId: chat.sessionId,
								},
								{ method: "POST", action: "/chats" },
							);

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
						<Button type="submit" loading={fetcher.state !== "idle"}>
							Save
						</Button>
					</Stack>
				</form>
			</Modal>
		</>
	);
}
