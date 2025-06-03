import {
	ActionIcon,
	AppShell,
	Box,
	Text,
	Button,
	Flex,
	Group,
	Modal,
	PasswordInput,
	rem,
	ScrollArea,
	SegmentedControl,
	Select,
	Stack,
	TextInput,
	Title,
	Tooltip,
	useMantineColorScheme,
	useMantineTheme,
	type SelectProps,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import {
	IconCheck,
	IconMoonStars,
	IconPlus,
	IconRobotFace,
	IconSearch,
	IconServer,
	IconSettings,
	IconSunHigh,
	IconTrash,
	IconX,
} from "@tabler/icons-react";
import {
	Link,
	useNavigate,
	useLocation,
	useFetcher,
	useRouteLoaderData,
} from "react-router";
import { useEffect, useState } from "react";
import { useChatId } from "../hooks/useChatId";
import { Chats } from "./Chats";
import { CreatePromptModal } from "./CreatePromptModal";
// import { LogoText } from "./Logo";
import { Prompts } from "./Prompts";
import { SettingsModal } from "./SettingsModal";
import { config } from "../utils/config";
import type { Route } from "../routes/+types/chats";
import { useDisclosure } from "@mantine/hooks";

declare global {
	interface Window {
		todesktop?: any;
	}
}

const iconProps = {
	stroke: 1.5,
	color: "currentColor",
	opacity: 0.6,
	size: 16,
};

export function Layout({ children }: { children: React.ReactNode }) {
	const [createInstanceOpened, { open, close }] = useDisclosure(false);
	const theme = useMantineTheme();
	const [opened, setOpened] = useState(false);
	const [tab, setTab] = useState<"Chats" | "Prompts">("Chats");
	const { colorScheme, toggleColorScheme } = useMantineColorScheme();
	const navigate = useNavigate();
	const location = useLocation();
	const chatsRouteData = useRouteLoaderData(
		"routes/chats",
	) as Route.ComponentProps["loaderData"];

	const [search, setSearch] = useState("");
	const chatId = useChatId();

	// const chat = useLiveQuery(async () => {
	// 	if (!chatId) return null;
	// 	return db.chats.get(chatId);
	// }, [chatId]);

	const border = `${rem(1)} solid ${
		colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[2]
	}`;

	useEffect(() => {
		setOpened(false);
	}, [location.pathname]);

	const fetcher = useFetcher();
	const selectAgentFetcher = useFetcher();
	const selectInstanceFetcher = useFetcher();

	const renderInstanceOption: SelectProps["renderOption"] = ({
		option,
		checked,
	}) => {
		return (
			<Group flex="1" gap="xs" justify="space-between">
				<Group>
					{checked && (
						<IconCheck style={{ marginInlineStart: "auto" }} {...iconProps} />
					)}
					{option.label}
				</Group>

				<Group gap="xs">
					<EditInstanceAction
						instance={{
							name: option.label,
							id: option.value,
							email: option.email,
							host: option.host,
						}}
					/>
					<DeleteInstanceAction
						instance={{ name: option.label, id: option.value }}
					/>
				</Group>
			</Group>
		);
	};

	return (
		<AppShell
			className={`${colorScheme}-theme`}
			navbar={{ width: 300, breakpoint: "sm" }}
			header={{ height: 60 }}
			layout="alt"
			padding={0}
		>
			{/* {JSON.stringify(chats)} */}
			{/* {chat ? ( */}
			<AppShell.Header p="xs" className="app-region-drag">
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						height: "100%",
					}}
				>
					{/* {`${chat?.description} - ${chat?.totalTokens ?? 0} tokens`} */}
				</div>
			</AppShell.Header>
			{/* ) : undefined} */}

			<AppShell.Navbar visibleFrom="md" hidden={!opened}>
				<AppShell.Section className="app-region-drag">
					<Box
						style={{
							height: 60,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							borderBottom: border,
						}}
					>
						<Link
							to="/"
							className="app-region-no-drag"
							style={{
								marginTop: 0,
								padding: 4,
								textDecoration: "none",
							}}
						>
							<Title order={3} c="blue" p={0}>
								JIVAS Chat
							</Title>
							{/* <LogoText
								style={{
									height: 22,
									color: "#27B882",
									display: "block",
								}}
							/> */}
						</Link>
						{/* <MediaQuery largerThan="md" styles={{ display: "none" }}>
                <Burger
                  opened={opened}
                  onClick={() => setOpened((o) => !o)}
                  size="sm"
                  color={theme.colors.gray[6]}
                  className="app-region-no-drag"
                  sx={{ position: "fixed", right: 16 }}
                />
              </MediaQuery> */}
					</Box>
				</AppShell.Section>
				<AppShell.Section
					style={(theme) => ({
						padding: rem(4),
						background:
							colorScheme === "dark"
								? theme.colors.dark[8]
								: theme.colors.gray[1],
						borderBottom: border,
					})}
				>
					<SegmentedControl
						fullWidth
						value={tab}
						onChange={(value) => setTab(value as typeof tab)}
						data={["Chats", "Prompts"]}
					/>
					<Box style={{ padding: 4 }}>
						{chatsRouteData.showInstanceSelector ? (
							<Select
								data={chatsRouteData?.instances?.map((instance) => ({
									label: instance.name,
									value: instance.id,
									host: instance.host,
									email: instance.email,
								}))}
								renderOption={renderInstanceOption}
								rightSectionPointerEvents={"auto"}
								leftSectionPointerEvents="auto"
								rightSection={
									<ActionIcon size="sm" onClick={open}>
										<IconPlus />
									</ActionIcon>
								}
								defaultValue={chatsRouteData?.selectedInstanceId}
								allowDeselect={false}
								searchable
								onChange={(value) => {
									if (value) {
										selectInstanceFetcher.submit(
											{ _action: "selectInstance", instanceId: value },
											{ action: "/chats", method: "POST" },
										);
									}
								}}
								my="sm"
								leftSection={
									<IconServer style={{ width: rem(16), height: rem(16) }} />
								}
							/>
						) : null}
						<CreateInstanceModal opened={createInstanceOpened} close={close} />
						{chatsRouteData.showAgentSelector ? (
							<Select
								data={chatsRouteData?.agents?.map((agent) => ({
									label: agent.name,
									value: agent.id,
								}))}
								searchable
								allowDeselect={false}
								onChange={(value) => {
									if (value) {
										selectAgentFetcher.submit(
											{ _action: "selectAgent", agentId: value },
											{ action: "/chats", method: "POST" },
										);
									}
								}}
								defaultValue={chatsRouteData?.selectedAgentId}
								my="sm"
								leftSection={
									<IconRobotFace style={{ width: rem(16), height: rem(16) }} />
								}
							/>
						) : null}
						{tab === "Chats" && (
							<Button
								fullWidth
								leftSection={<IconPlus size={20} />}
								// component={Link}
								loading={fetcher.state !== "idle"}
								onClick={() => {
									fetcher.submit(
										{ _action: "addFrame" },
										{ method: "POST", action: "/chats" },
									);
								}}
								// to="/chats"
							>
								New Chat
							</Button>
						)}
						{tab === "Prompts" && <CreatePromptModal />}
					</Box>
				</AppShell.Section>
				<AppShell.Section
					style={(theme) => ({
						padding: rem(4),
						background:
							colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
						borderBottom: border,
					})}
				>
					<TextInput
						variant="unstyled"
						radius={0}
						placeholder="Search"
						value={search}
						onChange={(event) =>
							setSearch(event.currentTarget.value.toLowerCase())
						}
						style={{ paddingInline: 4 }}
						leftSection={<IconSearch opacity={0.8} size={20} />}
						rightSection={
							!!search && (
								<ActionIcon onClick={() => setSearch("")}>
									<IconX opacity={0.5} size={20} />{" "}
								</ActionIcon>
							)
						}
					/>
				</AppShell.Section>
				<AppShell.Section grow component={ScrollArea}>
					{tab === "Chats" && <Chats search={search} />}
					{tab === "Prompts" && (
						<Prompts search={search} onPlay={() => setTab("Chats")} />
					)}
				</AppShell.Section>
				<AppShell.Section style={{ borderTop: border }} p="xs">
					<Flex justify="space-between">
						{config?.allowDarkModeToggle && (
							<Tooltip
								label={colorScheme === "dark" ? "Light Mode" : "Dark Mode"}
							>
								<ActionIcon
									// flex={1}
									variant="transparent"
									size="xl"
									onClick={() => toggleColorScheme()}
								>
									{colorScheme === "dark" ? (
										<IconSunHigh size={20} />
									) : (
										<IconMoonStars size={20} />
									)}
								</ActionIcon>
							</Tooltip>
						)}
						{config?.allowSettingsModal && (
							<SettingsModal>
								<Tooltip label="Settings">
									<ActionIcon
										variant="transparent"
										// style={{ flex: 1 }}
										size="xl"
									>
										<IconSettings size={20} />
									</ActionIcon>
								</Tooltip>
							</SettingsModal>
						)}
					</Flex>
				</AppShell.Section>
			</AppShell.Navbar>
			{/* <MediaQuery largerThan="md" styles={{ display: "none" }}>
				<Burger
					opened={opened}
					onClick={() => setOpened((o) => !o)}
					size="sm"
					color={theme.colors.gray[6]}
					className="app-region-no-drag"
					sx={{ position: "fixed", top: 16, right: 16, zIndex: 100 }}
				/>
			</MediaQuery> */}
			<AppShell.Main>{children}</AppShell.Main>
		</AppShell>
	);
}

function CreateInstanceModal({
	opened,
	close,
}: {
	opened: boolean;
	close: () => void;
}) {
	const fetcher = useFetcher();
	return (
		<Modal
			opened={opened}
			onClose={close}
			title="Add Instance"
			closeOnClickOutside={false}
		>
			<fetcher.Form method="POST" action={"/chats"}>
				<Stack>
					<TextInput name="name" label="Name" />
					<TextInput name="host" label="Host" />
					<TextInput type="email" name="email" label="Email" />
					<PasswordInput name="password" label="Password" />

					<input
						type="hidden"
						hidden
						name="_action"
						value="addInstance"
					></input>

					<Button mt="sm" type="submit" loading={fetcher.state !== "idle"}>
						Add Instance
					</Button>
				</Stack>
			</fetcher.Form>
		</Modal>
	);
}

function EditInstanceAction({
	instance,
}: {
	instance: { name: string; host: string; email: string; id: string };
}) {
	const fetcher = useFetcher();

	useEffect(() => {
		if (fetcher?.data?.success) {
			modals?.close("edit-instance");
		}
	}, [fetcher?.data?.success]);

	return (
		<>
			<ActionIcon
				size="sm"
				onClick={(e) => {
					e.stopPropagation();

					modals.open({
						modalId: "edit-instance",
						title: `Edit Instance - ${instance.name}`,
						children: (
							<fetcher.Form method="POST" action={"/chats"}>
								<Stack>
									<TextInput
										name="name"
										label="Name"
										defaultValue={instance.name}
									/>
									<TextInput
										name="host"
										label="Host"
										defaultValue={instance.host}
									/>
									<TextInput
										type="email"
										name="email"
										label="Email"
										defaultValue={instance.email}
									/>
									<PasswordInput name="password" label="Password" />

									<input type="hidden" hidden name="id" value={instance.id} />
									<input
										type="hidden"
										hidden
										name="_action"
										value="editInstance"
									/>

									<Group justify="flex-end" mt="sm">
										<Button
											variant="default"
											onClick={() => {
												modals.close("edit-instance");
											}}
										>
											Cancel
										</Button>

										<Button type="submit" loading={fetcher.state !== "idle"}>
											Update Instance
										</Button>
									</Group>
								</Stack>
							</fetcher.Form>
						),
					});
				}}
			>
				<IconSettings {...iconProps} />
			</ActionIcon>
		</>
	);
}

function DeleteInstanceAction({
	instance,
}: {
	instance: { name: string; id: string };
}) {
	const fetcher = useFetcher();
	const [opened, { open, close }] = useDisclosure(false);

	return (
		<>
			<Modal
				opened={opened}
				onClose={close}
				title={`Delete Instance - ${instance.name}`}
			>
				<Text>Are you sure you want to delete this instance?</Text>

				<fetcher.Form action="/chats" method="POST">
					<Group justify="flex-end" mt="lg">
						<Button variant="default" onClick={close}>
							Cancel
						</Button>
						<input readOnly hidden name="id" value={instance.id} />
						<Button
							name="_action"
							value="deleteInstance"
							type="submit"
							loading={fetcher.state !== "idle"}
							color="red"
						>
							Delete Instance
						</Button>
					</Group>
				</fetcher.Form>
			</Modal>

			<ActionIcon
				color="red"
				size="sm"
				onClick={(e) => {
					e.stopPropagation();
					open();
				}}
			>
				<IconTrash {...iconProps} />
			</ActionIcon>
		</>
	);
}
