import { Jivas } from "~/utils/jivas.server";
import type { Route } from "./+types/interact";
import { sessionStorage } from "~/auth.server";

export async function action({ request }: Route.ActionArgs) {
	const data = await request.json();

	try {
		const session = await sessionStorage.getSession(
			request.headers.get("cookie"),
		);
		const user = session.get("user") as { id: string; email: string };
		const jivas = new Jivas(user);

		const response = await jivas.interact(data);

		// Check if the response from the backend is OK
		if (!response.ok) {
			console.error(
				"Backend fetch failed:",
				response.status,
				response.statusText,
			);
			// Propagate the error status and body (if any) from the backend
			return new Response(response.body, {
				status: response.status,
				statusText: response.statusText,
				// Optionally copy other relevant headers from the backend response if needed
			});
		}

		// If the response is OK, stream the body back to the client
		// The backend is expected to return a text/event-stream
		return new Response(response.body, {
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
				// Add other headers from the backend if necessary, e.g., response.headers.get('X-My-Header')
				// Note: If the backend already sets these headers, proxying them might be better.
				// However, for SSE, these headers are standard and can be set here directly.
			},
		});
	} catch (error) {
		// Catch network errors, aborts, or issues during the fetch itself
		console.error("Error during interact fetch:", error);
		// Return an appropriate error response to the client
		return new Response("Internal Server Error", { status: 500 });
	}
}
