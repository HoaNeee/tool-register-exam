import {
	KEY_IS_AUTO_ALL,
	KEY_IS_AUTO_LOOP,
	KEY_IS_DEVELOPER_MODE,
	KEY_IS_USE_PROXY,
	KEY_PROXY,
} from "@/constants/constants";
import { DB_getValue, DB_setValue } from "@/utils/storage";

import type { IProxy } from "@/types/types";

export const storageService = {
	async setIsAutoRegisterAll(b: boolean) {
		await DB_setValue(KEY_IS_AUTO_ALL, b);
	},

	async getIsAutoRegisterAll() {
		return await DB_getValue(KEY_IS_AUTO_ALL, false);
	},

	async getProxySaved(): Promise<IProxy | null> {
		return await DB_getValue(KEY_PROXY);
	},

	async saveProxySaved(proxy: IProxy | null) {
		await DB_setValue(KEY_PROXY, proxy);
	},

	async getIsUseProxy() {
		return await DB_getValue(KEY_IS_USE_PROXY, false);
	},

	async setIsUseProxy(b: boolean) {
		await DB_setValue(KEY_IS_USE_PROXY, b);
	},

	async setIsDeveloperMode(b: boolean) {
		await DB_setValue(KEY_IS_DEVELOPER_MODE, b);
	},

	async getIsDeveloperMode() {
		return await DB_getValue(KEY_IS_DEVELOPER_MODE, false);
	},

	async getIsAutoLoop() {
		return await DB_getValue(KEY_IS_AUTO_LOOP, false);
	},

	async setIsAutoLoop(b: boolean) {
		await DB_setValue(KEY_IS_AUTO_LOOP, b);
	},
};
