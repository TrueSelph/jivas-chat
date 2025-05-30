import {
	ActionIcon,
	Button,
	Modal,
	Stack,
	Textarea,
	TextInput,
	Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPlaylistAdd, IconPlus } from "@tabler/icons-react";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";

export function CreatePromptModal({ content }: { content?: string }) {
	const [opened, { open, close }] = useDisclosure(false);
	const [submitting, setSubmitting] = useState(false);

	const [value, setValue] = useState("");
	const [title, setTitle] = useState("");
	useEffect(() => {
		setValue(content ?? "");
	}, [content]);

	const fetcher = useFetcher<{ success: true; id: string }>();

	useEffect(() => {
		if (fetcher?.data?.id) {
			close();
		}
	}, [fetcher?.data?.id]);

	return (
		<>
			{content ? (
				<Tooltip label="Save Prompt" position="left">
					<ActionIcon size="sm" variant="transparent" c="gray" onClick={open}>
						<IconPlaylistAdd opacity={0.5} size={20} />
					</ActionIcon>
				</Tooltip>
			) : (
				<Button fullWidth onClick={open} leftSection={<IconPlus size={20} />}>
					New Prompt
				</Button>
			)}
			<Modal opened={opened} onClose={close} title="Create Prompt" size="lg">
				<fetcher.Form method="POST" action="/chats">
					<Stack>
						<TextInput
							label="Title"
							name="title"
							value={title}
							onChange={(event) => setTitle(event.currentTarget.value)}
							formNoValidate
							data-autofocus
						/>
						<Textarea
							placeholder="Content"
							autosize
							name="content"
							minRows={5}
							maxRows={10}
							value={value}
							onChange={(event) => setValue(event.currentTarget.value)}
						/>
						<input type="hidden" name="_action" readOnly value="createPrompt" />
						<Button type="submit" loading={fetcher.state !== "idle"}>
							Save
						</Button>
					</Stack>
				</fetcher.Form>
			</Modal>
		</>
	);
}
