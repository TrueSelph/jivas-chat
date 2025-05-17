import { Button, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconTrash } from "@tabler/icons-react";

export function DeleteAllDataModal({ onOpen }: { onOpen: () => void }) {
	const [opened, { open, close }] = useDisclosure(false, { onOpen });

	return (
		<>
			<Button
				onClick={open}
				variant="outline"
				c="red"
				leftSection={<IconTrash size={20} />}
			>
				Delete All Data
			</Button>
			<Modal
				opened={opened}
				onClose={close}
				title="Delete All Data"
				size="md"
				withinPortal
			>
				<Stack>
					<Text size="sm">Are you sure you want to delete your data?</Text>
					<Button
						onClick={async () => {
							localStorage.clear();
							window.location.assign("/");
						}}
						c="red"
					>
						Delete
					</Button>
				</Stack>
			</Modal>
		</>
	);
}
