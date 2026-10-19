import { KEY_MESSAGE_FROM_BACKGROUND } from "@/constants/constants";

async function DB_getValue(key: string, defaultValue?: unknown) {
	try {
		const result = await chrome?.storage?.local?.get(key);
		return result?.[key] !== undefined ? result?.[key] : defaultValue;
	} catch (e) {
		console.log("[DB Compat] DB_getValue error:", e);
		return defaultValue;
	}
}

async function DB_setValue(key: string, value: unknown) {
	try {
		await chrome?.storage?.local?.set({ [key]: value });
	} catch (e) {
		console.log("[DB Compat] DB_setValue error:", e);
	}
}

async function DB_deleteValue(key: string) {
	try {
		await chrome?.storage?.local?.remove(key);
	} catch (e) {
		console.log("[DB Compat] DB_deleteValue error:", e);
	}
}

async function DB_getListValue(): Promise<unknown[]> {
	try {
		const result = await chrome?.storage?.local?.get(null);
		return result;
	} catch (e) {
		console.log("[DB Compat] DB_getListValue error:", e);
	}
}

async function sendMessageFromBackground(key: string, value: unknown) {
	try {
		await DB_setValue(key, value);
	} catch (error) {
		console.log("Error at sendMessageFromBackground: ", error);
	}
}

export {
	DB_getValue,
	DB_setValue,
	DB_deleteValue,
	DB_getListValue,
	sendMessageFromBackground,
};
