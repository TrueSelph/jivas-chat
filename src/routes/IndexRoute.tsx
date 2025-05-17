import {
	Badge,
	Box,
	Button,
	Center,
	Container,
	Group,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from "@mantine/core";
import {
	IconCloudDownload,
	IconCurrencyDollar,
	IconKey,
	IconLock,
	IconNorthStar,
} from "@tabler/icons-react";
import { Logo } from "../components/Logo";
import { SettingsModal } from "../components/SettingsModal";
import { config } from "../utils/config";
import { useQueryOne } from "@triplit/react";
import { ChatInput } from "./ChatRoute";
import { nanoid } from "nanoid";
import { useState } from "react";

export function IndexRoute() {
	const settings = JSON.parse(localStorage.getItem("settings") || "{}");

	const [submitting, setSubmitting] = useState(false);

	return (
		<>
			<Container
				size="md"
				style={{ display: "flex", alignItems: "center" }}
				h="calc(100vh - 200px)"
			>
				<Stack align="center" w="100%">
					<Text>
						<Title order={3} c="blue" p={0}>
							JIVAS Chat
						</Title>
						{/* <Logo style={{ maxWidth: 240 }} /> */}
					</Text>
					<Text flex={1} mt={4} size="xl">
						Not just another ChatGPT user-interface!
					</Text>
					<Box flex={1} w="100%">
						<ChatInput
							setSubmitting={setSubmitting}
							submitting={submitting}
							chatId={nanoid()}
							userMessages={[]}
						/>
					</Box>
					{/* <SimpleGrid mt={50} cols={{ base: 1, md: 3 }} spacing={30}>
						{features.map((feature) => (
							<div key={feature.title}>
								<ThemeIcon variant="outline" size={50} radius={50}>
									<feature.icon size={26} stroke={1.5} />
								</ThemeIcon>
								<Text mt="sm" mb={7}>
									{feature.title}
								</Text>
								<Text size="sm" c="dimmed" sx={{ lineHeight: 1.6 }}>
									{feature.description}
								</Text>
							</div>
						))}
					</SimpleGrid> */}
					<Group mt={50}>
						{config.allowSettingsModal && (
							<SettingsModal>
								<Button
									size="md"
									variant={settings?.jivasHost ? "light" : "filled"}
									leftSection={<IconKey size={20} />}
								>
									{settings?.jivasHost ? "Change Jivas Host" : "Set Jivas Host"}
								</Button>
							</SettingsModal>
						)}
						{config.showDownloadLink && !window.todesktop && (
							<Button
								component="a"
								href="https://dl.todesktop.com/230313oyppkw40a"
								// href="https://download.chatpad.ai/"
								size="md"
								variant="outline"
								leftSection={<IconCloudDownload size={20} />}
							>
								Download Desktop App
							</Button>
						)}
					</Group>
				</Stack>
			</Container>
		</>
	);
}

const features = [
	{
		icon: IconCurrencyDollar,
		title: "Free and open source",
		description:
			"This app is provided for free and the source code is available on GitHub.",
	},
	{
		icon: IconLock,
		title: "Privacy focused",
		description:
			"No tracking, no cookies, no bullshit. All your data is stored locally.",
	},
	{
		icon: IconNorthStar,
		title: "Best experience",
		description:
			"Crafted with love and care to provide the best experience possible.",
	},
];
