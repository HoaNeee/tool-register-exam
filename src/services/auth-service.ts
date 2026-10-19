import type { IAuth, IResponseLogin, IThongTinCaNhan } from "@/types/types";
import { get, post } from "@/utils/api-request";

export const authService = {
	async login(cccd: string, password: string) {
		try {
			const res = (await post("/auth/login", {
				cccd: cccd,
				password: password,
			})) as IResponseLogin;

			return res;
		} catch (error) {
			throw error;
		}
	},

	async getMe(auth: IAuth) {
		try {
			const res = await get("/me/profile", auth);
			return res.data as IThongTinCaNhan;
		} catch (error) {
			throw error;
		}
	},
};
