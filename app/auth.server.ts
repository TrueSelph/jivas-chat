import { Authenticator } from "remix-auth";
import { createCookieSessionStorage } from "react-router";
import { FormStrategy } from "remix-auth-form";
import { usersTable, type UserRole } from "./db/schema";
import argon2 from "argon2";
import { db, eq } from "./db/db.server";

// Define your user type
type User = {
	id: string;
	email: string;
	role: UserRole;
};

// Create a session storage
export const sessionStorage = createCookieSessionStorage({
	cookie: {
		name: "__session",
		httpOnly: true,
		path: "/",
		sameSite: "lax",
		secrets: ["s3cr3t"], // replace this with an actual secret
		secure: process.env.NODE_ENV === "production",
	},
});

// Create an instance of the authenticator, pass a generic with what
// strategies will return
export const authenticator = new Authenticator<User>();

// Your authentication logic (replace with your actual DB/API calls)
async function login(email: string, password: string): Promise<User> {
	const [user] = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.email, email));

	if (!user) throw new Error("User not found");

	const isPasswordValid = await argon2.verify(user.password, password);

	if (!isPasswordValid) throw new Error("Invalid password");

	return { id: user.id, email: user.email, role: user.role };
}

async function signup(email: string, password: string): Promise<User> {
	const [user] = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.email, email));

	if (user) throw new Error("User already exists");

	const hashedPassword = await argon2.hash(password);

	const [newUser] = await db
		.insert(usersTable)
		.values({ email, password: hashedPassword })
		.returning();

	return { id: newUser.id, email: newUser.email, role: newUser.role };
}

authenticator.use(
	new FormStrategy(async ({ form }) => {
		const _action = form.get("_action") as string;
		const email = form.get("email") as string;
		const password = form.get("password") as string;

		if (!email || !password) {
			throw new Error("Email and password are required");
		}

		if (_action === "login") {
			return await login(email, password);
		}

		if (_action === "signup") {
			return await signup(email, password);
		}

		throw new Error("Invalid action");
	}),
	// each strategy has a name and can be changed to use the same strategy
	// multiple times, especially useful for the OAuth2 strategy.
	"user-pass",
);
