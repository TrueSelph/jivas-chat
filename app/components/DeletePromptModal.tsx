import { ActionIcon, Button, Modal, Stack, Text, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useApiKey } from "../hooks/useApiKey";
import { useChatId } from "../hooks/useChatId";
import { useFetcher } from "react-router";
import type { Route } from "../routes/+types/chats";

export function DeletePromptModal({
	prompt,
}: {
	prompt: Route.ComponentProps["loaderData"]["prompts"][number];
}) {
	const [opened, { open, close }] = useDisclosure(false);
	const [submitting, setSubmitting] = useState(false);

	const [key, setKey] = useApiKey();
	const [value, setValue] = useState("");

	useEffect(() => {
		setValue(key);
	}, [key]);
	const chatId = useChatId();
	const fetcher = useFetcher();

	return (
		<>
			<Modal opened={opened} onClose={close} title="Delete Prompt" size="md">
				<fetcher.Form method="POST" action="/chats">
					<Stack>
						<Text size="sm">Are you sure you want to delete this prompt?</Text>
						<input type="hidden" name="id" value={prompt.id} />
						<input type="hidden" name="_action" value={"deletePrompt"} />
						<Button
							type="submit"
							color="red"
							loading={fetcher.state !== "idle"}
						>
							Delete
						</Button>
					</Stack>
				</fetcher.Form>
			</Modal>
			<Tooltip label="Delete Prompt">
				<ActionIcon color="red" size="lg" onClick={open}>
					<IconTrash size={20} />
				</ActionIcon>
			</Tooltip>
		</>
	);
}
