import type {
	IAuth,
	ICoSoLienKet,
	IDiaDiem,
	IKyThiChuaDienRa,
} from "@/types/types";
import { get, post } from "@/utils/api-request";
import { CustomError } from "@/utils/exception";

export const examRemoteService = {
	async getDiaDiemThi() {
		try {
			const api = "/dia-diem";
			const res = await get(api);
			return res.data as IDiaDiem[];
		} catch (error) {
			throw error;
		}
	},

	async getCoSoLienKet() {
		try {
			const api = "/co-so-lien-ket";
			const res = await get(api);
			return res.data as ICoSoLienKet[];
		} catch (error) {
			throw error;
		}
	},

	async getKyThiChuaDienRa({
		diaDiemCode = "",
		hasRegisterCode = 0,
	}: {
		diaDiemCode?: string;
		hasRegisterCode?: number;
	} = {}) {
		try {
			//https://hsk.hcmue.edu.vn/v1/api/ky-thi-mo/comming-exam?limit=1000&dia_diem_code=HUIT&hasRegisterCode=0

			let api = `/ky-thi-mo/comming-exam?limit=1000`;
			if (diaDiemCode) {
				api += `&dia_diem_code=${diaDiemCode}`;
			}
			if (hasRegisterCode !== null || hasRegisterCode !== undefined) {
				api += `&hasRegisterCode=${hasRegisterCode}`;
			}
			const res = await get(api);
			return res.data as IKyThiChuaDienRa[];
		} catch (error) {
			throw error;
		}
	},

	async checkExamResgistration({
		id,
		auth,
		ma_cap_thi,
		ngay_mo_dang_ky,
	}: {
		id?: string;
		auth?: IAuth;
		ma_cap_thi?: string;
		ngay_mo_dang_ky?: string;
	} = {}) {
		try {
			//https://hsk.hcmue.edu.vn/v1/api/thi-sinh/check

			//encode example 2027-10-26 09:00:00 => 2027-10-26+09:00:00
			const api = `/dang-ky-thi/check-registration?ma_cap_thi=${ma_cap_thi}&ngay_mo_dang_ky=${ngay_mo_dang_ky?.replaceAll(" ", "+")}`;

			const res = await get(api, auth);
			return {
				id: id,
				is_registered: res.data?.["isRegistered"],
				registration: res.data?.["registration"],
			};
		} catch (error) {
			throw error;
		}
	},

	async registerExam(payload: {
		ma_cap_thi: string;
		ngay_mo_dang_ky: string;
		answers: [];
		auth: IAuth;
	}) {
		try {
			const ma_cap_thi = payload?.ma_cap_thi || "";
			const ngay_mo_dang_ky = payload?.ngay_mo_dang_ky || "";
			const answers = payload?.answers || [];
			const auth = payload?.auth;

			if (!auth) return;

			const api = `/dang-ky-thi`;
			const res = await post(
				api,
				{
					ma_cap_thi,
					ngay_mo_dang_ky,
					answers,
				},
				auth,
			);
			if (res.data) return true;
			throw new CustomError("Thất bại", 400);
		} catch (error) {
			throw error;
		}
	},
};
