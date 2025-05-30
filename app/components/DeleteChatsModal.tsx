import { Button, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconTrash } from "@tabler/icons-react";

export function DeleteChatsModal({ onOpen }: { onOpen: () => void }) {
	const [opened, { open, close }] = useDisclosure(false, { onOpen });

	return (
		<>
			<Button
				onClick={open}
				variant="outline"
				color="red"
				leftSecton={<IconTrash size={20} />}
			>
				Delete Chats
			</Button>
			<Modal
				opened={opened}
				onClose={close}
				title="Delete Chats"
				size="md"
				withinPortal
			>
				<Stack>
					<Text size="sm">Are you sure you want to delete your chats?</Text>
					<Button
						onClick={async () => {
							// await triplit.transact(async (tx) => {
							// 	const chats = await tx.fetch(triplit.query("chats"));
							// 	const messages = await tx.fetch(triplit.query("messages"));

							// 	await Promise.all([
							// 		...chats.map(async (chat) => tx.delete("chats", chat.id)),
							// 		...messages.map(async (message) =>
							// 			tx.delete("messages", message.id),
							// 		),
							// 	]);
							// });

							localStorage.clear();
							window.location.assign("/");
						}}
						color="red"
					>
						Delete
					</Button>
				</Stack>
			</Modal>
		</>
	);
}
