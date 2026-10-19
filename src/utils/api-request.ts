import type { IAuth } from "@/types/types";
import { CustomError } from "./exception";

export const DOMAIN = "https://hsk.hcmue.edu.vn";
export const BASE_URL = DOMAIN + "/v1/api";

export interface ApiResponse {
	status: "error" | "success";
	data: object;
	message: string;
	success: boolean;
}

/**
 * This tool maybe use primarily get and post request
 */

async function get(params: string, auth?: IAuth): Promise<ApiResponse> {
	try {
		const header = {
			"Content-Type": "application/json",
		};

		if (auth?.token) {
			header["Authorization"] = `Bearer ${auth.token}`;
		}
		if (auth?.session?.device_id) {
			header["X-Device-Id"] = auth.session.device_id;
		}

		const response = await fetch(BASE_URL + params, {
			method: "GET",
			headers: header,
			signal: AbortSignal.timeout(8000),
		});

		const rawStatus = response.status;

		const res = (await response.json()) as ApiResponse;

		console.log("get response for " + params + ":", res);

		const status = res?.status;
		if (status !== undefined && status !== null && status === "error") {
			throw new CustomError(res?.message, rawStatus, status);
		}

		const success = res?.success;
		if (success !== undefined && success !== null && success === false) {
			throw new CustomError(res?.message, rawStatus, status);
		}

		if (rawStatus >= 400 && rawStatus < 500) {
			throw new CustomError(res?.message, rawStatus, status);
		}

		return res;
	} catch (error) {
		handleError(error);
		throw error;
	}
}

async function post(
	params: string,
	options?: object | null,
	auth?: IAuth,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<ApiResponse | any> {
	try {
		const header = {};
		header["Content-Type"] = "application/json";

		if (auth?.token) {
			header["Authorization"] = `Bearer ${auth.token}`;
		}
		if (auth?.session?.device_id) {
			header["X-Device-Id"] = auth.session.device_id;
		}

		const response = await fetch(BASE_URL + params, {
			method: "POST",
			headers: header,
			body: JSON.stringify(options),
			signal: AbortSignal.timeout(8000),
		});

		const rawStatus = response.status;

		const res = (await response.json()) as ApiResponse;

		console.log("get response for " + params + ":", res);

		const status = res?.status;
		if (status !== undefined && status !== null && status === "error") {
			throw new CustomError(res?.message, rawStatus, status);
		}

		const success = res?.success;
		if (success !== undefined && success !== null && success === false) {
			throw new CustomError(res?.message, rawStatus, status);
		}

		if (rawStatus >= 400 && rawStatus < 500) {
			throw new CustomError(res?.message, rawStatus, status);
		}

		return res;
	} catch (error) {
		handleError(error);
		throw error;
	}
}

function handleError(error: CustomError) {}

export { get, post };
