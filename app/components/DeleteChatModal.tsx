import { Button, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { cloneElement, useEffect, useState, type ReactNode } from "react";
import { useApiKey } from "../hooks/useApiKey";
import { useChatId } from "../hooks/useChatId";
// import { Frame } from "./Chats";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFetcher, useNavigate } from "react-router";
import type { Route } from "../routes/+types/chats";

export function DeleteChatModal({
	chat,
	children,
}: {
	chat: Route.ComponentProps["loaderData"]["frames"][0];
	children: ReactNode;
}) {
	const [opened, { open, close }] = useDisclosure(false);
	const [submitting, setSubmitting] = useState(false);

	const [key, setKey] = useApiKey();

	const [value, setValue] = useState("");
	useEffect(() => {
		setValue(key);
	}, [key]);
	const chatId = useChatId();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const settings = JSON.parse(localStorage.getItem("settings") || "{}");

	const fetcher = useFetcher();

	return (
		<>
			{cloneElement(children, { onClick: open })}
			<Modal opened={opened} onClose={close} title="Delete Chat">
				<form
					onSubmit={async (event) => {
						try {
							fetcher.submit(
								{ _action: "deleteFrame", sessionId: chat.sessionId },
								{ method: "POST", action: "/chats" },
							);

							event.preventDefault();

							if (chatId === chat.id) {
								navigate({ to: `/` });
							}

							close();

							notifications.show({
								title: "Deleted",
								message: "Chat deleted.",
							});
						} catch (error: any) {
							if (error.toJSON().message === "Network Error") {
								notifications.show({
									title: "Error",
									color: "red",
									message: "No internet connection.",
								});
							} else {
								notifications.show({
									title: "Error",
									color: "red",
									message:
										"Can't remove chat. Please refresh the page and try again.",
								});
							}
						}
					}}
				>
					<Stack>
						<Text size="sm">Are you sure you want to delete this chat?</Text>
						<Button
							type="submit"
							color="red"
							loading={fetcher.state !== "idle"}
						>
							Delete
						</Button>
					</Stack>
				</form>
			</Modal>
		</>
	);
}
