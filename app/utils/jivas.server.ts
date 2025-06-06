import { eq, sql } from "drizzle-orm";
import { db } from "~/db/db.server";
import { instancesTable, usersTable } from "~/db/schema";

export class Jivas {
	user: { id: string; email: string };
	host: string;
	agentId: string;

	constructor(
		user: { id: string; email: string },
		{ agentId }: { agentId?: string } = {},
	) {
		this.user = user;
		this.host = process.env.JIVAS_HOST || "";
		this.agentId = process.env.JIVAS_AGENT_ID || "";
	}

	async getToken() {
		if (!this.agentId) {
			const [userData] = await db
				.select()
				.from(usersTable)
				.where(eq(usersTable.id, this.user.id))
				.execute();

			this.agentId = userData.selectedAgentId || "";
		}

		let jivasPassword = process.env.JIVAS_PASSWORD || "";
		let jivasEmail = process.env.JIVAS_EMAIL || "";

		if (!jivasEmail) {
			const [userData] = await db
				.select()
				.from(usersTable)
				.where(eq(usersTable.id, this.user.id))
				.execute();

			const [instance] = userData.selectedInstanceId
				? await db
						.select({
							host: instancesTable.host,
							email: instancesTable.email,
							decryptedPassword: sql<string>`pgp_sym_decrypt(${instancesTable.password}, ${process.env.ENCRYPTION_KEY})`,
						})
						.from(instancesTable)
						.where(eq(instancesTable.id, userData.selectedInstanceId))
						.execute()
				: [null];

			if (instance) {
				this.host = instance.host;
				jivasEmail = instance.email;
				jivasPassword = instance.decryptedPassword;
			}
		}

		const user = await fetch(`${this.host}/user/login`, {
			method: "POST",
			body: JSON.stringify({ email: jivasEmail, password: jivasPassword }),
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then(
				(res) =>
					res.json() as Promise<{
						token: string;
						user: { email: string; id: string };
					}>,
			)
			.catch((err) => {
				console.error(err);
			});

		return { token: user?.token };
	}

	async deleteFrame({ sessionId }: { sessionId: string }) {
		const { token } = await this.getToken();

		const result = await fetch(`${this.host}/walker/delete_frame`, {
			method: "POST",
			body: JSON.stringify({
				agent_id: this.agentId,
				session_id: sessionId,
			}),
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		}).then((res) => {
			return res.json();
		});

		return result;
	}

	async updateFrame(data: { sessionId: string; label: string }) {
		const { token } = await this.getToken();

		const frame = await fetch(`${this.host}/walker/update_frame`, {
			method: "POST",
			body: JSON.stringify({
				agent_id: this.agentId,
				session_id: data.sessionId,
				label: data.label,
			}),
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		}).then((res) => {
			return res.json();
		});

		return frame;
	}

	async addFrame(data: { sessionId: string }) {
		const { token } = await this.getToken();

		const result = await fetch(`${this.host}/walker/add_frame`, {
			method: "POST",
			body: JSON.stringify({
				agent_id: this.agentId,
				session_id: data.sessionId,
			}),
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		}).then((res) => res.json());

		return result;
	}

	async getInteractions(data: { sessionId: string }) {
		const { token } = await this.getToken();

		const result = await fetch(`${this.host}/walker/get_interactions`, {
			method: "POST",
			body: JSON.stringify({
				agent_id: this.agentId,
				session_id: data.sessionId,
				reporting: true,
			}),
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		})
			.then(async (res) => await res.json())
			.then((res) => res.reports as Interaction[])
			.catch((err) => {
				console.log(err);

				return [];
			});

		return result;
	}

	async getAvatar(agentId: string) {
		const { token } = await this.getToken();

		const formData = new FormData();
		formData.append("args", `{"base64_prefix": false}`);
		formData.append("module_root", "actions.jivas.avatar_action");
		formData.append("agent_id", agentId);
		formData.append("walker", "get_avatar");

		const res = (await fetch(`${this.host}/action/walker`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
			},
			body: formData,
		})
			.then(async (res) => await res.json())
			.catch((err) => {
				console.log(err);
				return null;
			})) as [string, string];

		console.log({ res, agentId, host: this.host });

		return res;
	}

	async transcribe(data: { file: File }) {
		const { file } = data;
		const { token } = await this.getToken();

		const formData = new FormData();
		formData.append("args", "{}");
		formData.append("module_root", "jivas.agent.action");
		// formData.append("module_root", "actions.jivas.deepgram_stt_action");
		formData.append("agent_id", this.agentId);
		formData.append("walker", "invoke_stt_action");
		// formData.append("walker", "transcribe_audio");
		formData.append("attachments", file);

		const res = (await fetch(`${this.host}/action/walker`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
			},
			body: formData,
		}).then(async (res) => await res.json())) as
			| { success: false; message: string }
			| {
					success: true;
					duration: number;
					transcript: string;
			  };

		return res;
	}

	async listAgents() {
		const { token } = await this.getToken();

		const result = await fetch(`${this.host}/walker/list_agents`, {
			method: "POST",
			body: JSON.stringify({ reporting: true }),
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		})
			.then(async (res) => await res.json())
			.then((res) => res.reports as Agent[])
			.catch((err) => {
				console.log(err);

				return [];
			});

		return result;
	}

	async interact(data: {}, signal?: AbortSignal) {
		await this.getToken();

		signal?.addEventListener("abort", () => {
			console.log("Aborted request to interact");
		});

		return fetch(`${this.host}/interact`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ ...data, agent_id: this.agentId }),
			signal,
		});
	}
}

export type Interaction = {
	id: string;
	agent_id: string;
	channel: string;
	utterance: string;
	tokens: number;
	time_stamp: string;
	trail: string[];
	intents: any[]; // Replace 'any' with a more specific type if the structure is known
	functions: Record<string, any>; // Or a more specific type
	directives: string[];
	context_data: Record<string, any>; // Or a more specific type like { new_user?: boolean }
	events: any[]; // Replace 'any' with a more specific type if the structure is known
	response: {
		session_id: string;
		message_type: string; // Consider a union type if known, e.g., "TEXT"
		message: {
			message_type: string; // Consider a union type if known, e.g., "TEXT"
			content: string;
			meta: Record<string, any>; // Or a more specific type
		};
		tokens: number;
	};
	data: Record<string, any>; // Or a more specific type
	closed: boolean;
};

export type Agent = {
	id: string;
	published: boolean;
	name: string;
	description: string;
	descriptor: string;
	jpr_api_key: string;
	agent_logging: boolean;
	message_limit: number;
	flood_control: boolean;
	flood_block_time: number;
	window_time: number;
	flood_threshold: number;
	frame_size: number;
	tts_action: string;
	stt_action: string;
	vector_store_action: string;
	healthcheck_status: number;
	meta: {
		namespace: string;
		version: string;
		author: string;
		dependencies: {
			jivas: string;
		};
	};
};
