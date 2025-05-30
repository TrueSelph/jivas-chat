import { Button, Card, Flex, Group, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconDatabaseExport, IconDatabaseImport } from "@tabler/icons-react";
import download from "downloadjs";
import { cloneElement, type ReactNode } from "react";
import { db } from "../db";
import { DeleteAllDataModal } from "./DeleteAllDataModal";
import { DeleteChatsModal } from "./DeleteChatsModal";

export function DatabaseModal({ children }: { children: ReactNode }) {
	const [opened, { open, close }] = useDisclosure(false);

	const chatsCount = 0;

	const messagesCount = 0;

	const promptsCount = 0;

	return (
		<>
			{cloneElement(children, { onClick: open })}
			<Modal
				opened={opened}
				onClose={close}
				title="Database"
				size="lg"
				withinPortal
				keepMounted
			>
				<Stack>
					<Flex>
						<Card withBorder style={{ flex: 1 }}>
							<Text size="xl" align="center">
								{chatsCount}
							</Text>
							<Text size="xs" c="dimmed" align="center" tt="uppercase" fw={700}>
								Chats
							</Text>
						</Card>
						<Card withBorder style={{ flex: 1, marginLeft: -1 }}>
							<Text size="xl" align="center">
								{messagesCount}
							</Text>
							<Text size="xs" c="dimmed" align="center" tt="uppercase" fw={700}>
								Messages
							</Text>
						</Card>
						<Card withBorder style={{ flex: 1, marginLeft: -1 }}>
							<Text size="xl" align="center">
								{promptsCount}
							</Text>
							<Text size="xs" c="dimmed" align="center" tt="uppercase" fw={700}>
								Prompts
							</Text>
						</Card>
					</Flex>
					<Group>
						<Button
							variant="default"
							leftSection={<IconDatabaseExport size={20} />}
							onClick={async () => {
								const blob = await db.export();
								download(
									blob,
									`jivas-chat-export-${new Date().toLocaleString()}.json`,
									"application/json",
								);
								notifications.show({
									title: "Exporting Data",
									message: "Your data is being exported.",
								});
							}}
						>
							Export Data
						</Button>
						<input
							id="file-upload-btn"
							type="file"
							onChange={async (e) => {
								const file = e.currentTarget.files?.[0];
								if (!file) return;
								db.import(file, {
									acceptNameDiff: true,
									overwriteValues: true,
									acceptMissingTables: true,
									clearTablesBeforeImport: true,
								})
									.then(() => {
										notifications.show({
											title: "Importing data",
											message: "Your data is being imported.",
										});
									})
									.catch((error) => {
										notifications.show({
											title: "Error",
											color: "red",
											message: "The file you selected is invalid",
										});
									});
							}}
							accept="application/json"
							hidden
						/>
						<Button
							component="label"
							htmlFor="file-upload-btn"
							variant="default"
							leftSection={<IconDatabaseImport size={20} />}
						>
							Import Data
						</Button>
					</Group>
					<Group>
						<DeleteChatsModal onOpen={close} />
						<DeleteAllDataModal onOpen={close} />
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
