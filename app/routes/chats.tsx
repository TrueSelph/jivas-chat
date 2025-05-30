import { Outlet, redirect } from "react-router";
import { Layout } from "~/components/Layout";
import type { Route } from "./+types/chats";
import type { Frame } from "~/components/Chats";
import { sessionStorage } from "~/auth.server";
import {
	instancesTable,
	promptsTable,
	threadsTable,
	usersTable,
} from "~/db/schema";
import { db, eq, desc, and, sql } from "~/db/db.server";
import { Jivas } from "~/utils/jivas.server";

export const meta: Route.MetaFunction = ({ data }) => {
	return [{ title: `Chat | Jivas Chat` }];
};

export async function loader({ request }: Route.LoaderArgs) {
	const session = await sessionStorage.getSession(
		request.headers.get("cookie"),
	);
	const user = session.get("user");

	if (!user) throw redirect("/login");

	const jivas = new Jivas(user);

	let [userData] = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.id, user.id))
		.execute();

	const frames = await db
		.select({
			id: threadsTable.id,
			sessionId: threadsTable.sessionId,
			label: threadsTable.label,
			createdAt: threadsTable.createdAt,
		})
		.from(threadsTable)
		.where(
			and(
				eq(threadsTable.userId, user.id),
				eq(
					threadsTable.agentId,
					process.env.JIVAS_AGENT_ID || userData?.selectedAgentId || "",
				),
			),
		)
		.orderBy(desc(threadsTable.createdAt));

	const agents = await jivas.listAgents();

	if (!userData.selectedAgentId && !process.env.JIVAS_AGENT_ID) {
		const agents = await jivas.listAgents();
		const agent = agents?.[0];

		agent?.id &&
			(await db
				.update(usersTable)
				.set({ selectedAgentId: agent.id })
				.where(eq(usersTable.id, user.id))
				.then(() => {
					Object.assign(userData, { selectedAgentId: agent.id });
				}));
	}

	const prompts = await db.select().from(promptsTable);
	const instances = await db
		.select({ id: instancesTable.id, name: instancesTable.name })
		.from(instancesTable)
		.where(eq(instancesTable.userId, user.id));

	return {
		frames,
		instances,
		agents,
		showAgentSelector: !process.env.JIVAS_AGENT_ID,
		showInstanceSelector: !process.env.JIVAS_HOST,
		selectedAgentId: process.env.JIVAS_AGENT_ID || userData?.selectedAgentId,
		selectedInstanceId: userData?.selectedInstanceId,
		prompts,
	};
}

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData();

	const _action = formData.get("_action");

	const session = await sessionStorage.getSession(
		request.headers.get("cookie"),
	);
	const user = session.get("user") as { id: string; email: string };

	const jivas = new Jivas(user);

	if (_action === "deleteFrame") {
		try {
			const sessionId = formData.get("sessionId") as string;
			console.log({ sessionId });
			await db
				.delete(threadsTable)
				.where(eq(threadsTable.sessionId, sessionId));

			const result = await jivas.deleteFrame({ sessionId });

			return { result };
		} catch (err) {
			console.log(err);
		}
	}

	if (_action === "updateFrame") {
		try {
			const label = formData.get("label") as string;
			const sessionId = formData.get("sessionId") as string;

			const frame = await jivas.updateFrame({ sessionId, label });

			await db
				.update(threadsTable)
				.set({ label })
				.where(eq(threadsTable.sessionId, sessionId));

			return frame;
		} catch (err) {
			console.log(err);
		}
		return {};
	}

	if (_action === "createPrompt") {
		const title = formData.get("title") as string;
		const content = formData.get("content") as string;
		const [result] = await db
			.insert(promptsTable)
			.values({ title, content, userId: user.id })
			.returning();
		return { success: true, id: result.id };
	}

	if (_action === "deletePrompt") {
		const id = formData.get("id") as string;

		await db
			.delete(promptsTable)
			.where(and(eq(promptsTable.id, id), eq(promptsTable.userId, user.id)));

		return { success: true };
	}

	if (_action === "selectAgent") {
		const agentId = formData.get("agentId");

		if (agentId) {
			await db
				.update(usersTable)
				.set({ selectedAgentId: agentId as string })
				.where(eq(usersTable.id, user.id));

			return { success: true };
		}

		return { success: false };
	}

	if (_action === "selectInstance") {
		const instanceId = formData.get("instanceId");

		if (instanceId) {
			await db
				.update(usersTable)
				.set({ selectedInstanceId: instanceId as string })
				.where(eq(usersTable.id, user.id));

			return { success: true };
		}

		return { success: false };
	}

	if (_action === "addFrame") {
		const session = await sessionStorage.getSession(
			request.headers.get("cookie"),
		);
		const user = session.get("user") as { id: string };
		const [userData] = await db
			.select()
			.from(usersTable)
			.where(eq(usersTable.id, user.id))
			.execute();

		const [thread] = await db
			.insert(threadsTable)
			.values({
				userId: user.id,
				agentId: process.env.JIVAS_AGENT_ID || userData?.selectedAgentId || "",
			})
			.returning();

		await jivas.addFrame({ sessionId: thread.sessionId });

		return redirect("/chats/" + thread.sessionId);
	}

	if (_action === "addInstance") {
		const name = formData.get("name") as string;
		const host = formData.get("host") as string;
		const email = formData.get("email") as string;
		const password = formData.get("password") as string;

		await db.insert(instancesTable).values({
			email,
			host,
			name,
			password: sql`pgp_sym_encrypt(${password}, ${process.env.ENCRYPTION_KEY})`,
			userId: user.id,
		});
	}

	return {};
}

export default function Chats() {
	return (
		<Layout>
			<Outlet />
		</Layout>
	);
}
