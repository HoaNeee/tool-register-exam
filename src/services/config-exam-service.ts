import {
	KEY_LIST_CONFIG_EXAM,
	KEY_MESSAGE_FROM_BACKGROUND,
} from "@/constants/constants";
import type {
	ConfigExamTarget,
	IStatusConfigExam,
	TStatusConfigExam,
} from "@/types/types";
import {
	DB_getValue,
	DB_setValue,
	sendMessageFromBackground,
} from "@/utils/storage";
import { genID, logError, random, sleep } from "@/utils/utils";
import { examRemoteService } from "./exam-remote-service";
import { ID_TEST } from "@/constants/default-value";
import { CustomError } from "@/utils/exception";
import { storageService } from "./storage-service";
import { schedulerService } from "./scheduler-service";

export const configExamService = {
	async addNewConfigExamService(
		data: ConfigExamTarget,
	): Promise<ConfigExamTarget> {
		try {
			const list = await this.getListConfigExam();
			data.id = genID();
			data.status = "waiting";
			list.push(data);
			await this.saveListConfigExam(list);
			return data;
		} catch (error) {
			throw error;
		}
	},

	async getListConfigExam(is_get_status = false): Promise<ConfigExamTarget[]> {
		try {
			const res = (await DB_getValue(
				KEY_LIST_CONFIG_EXAM,
				[],
			)) as ConfigExamTarget[];

			if (is_get_status) {
				const listStatus = await this.getListStatusConfigExam(res);
				listStatus.forEach((item) => {
					const exam = res.find((i) => i.id === item.id);
					if (exam) {
						exam.status = item.status || exam.status;
					}
				});
			}

			return res;
		} catch (error) {
			throw error;
		}
	},

	async saveListConfigExam(list: ConfigExamTarget[]) {
		try {
			await DB_setValue(KEY_LIST_CONFIG_EXAM, list);
		} catch (error) {
			throw error;
		}
	},

	async removeConfigExam(id: string): Promise<boolean> {
		try {
			const list = await this.getListConfigExam();
			const newList = list.filter((item) => item.id !== id);
			await this.saveListConfigExam(newList);
			return true;
		} catch (error) {
			throw error;
		}
	},

	async updateConfigExam(id: string, data: ConfigExamTarget): Promise<boolean> {
		try {
			const list = await this.getListConfigExam();

			const newList = list.map((item) => {
				if (item.id === id) {
					return data;
				}
				return item;
			});
			await this.saveListConfigExam(newList);
			return true;
		} catch (error) {
			throw error;
		}
	},

	async updateAutoRegister(id: string, isAuto: boolean): Promise<boolean> {
		try {
			const list = await this.getListConfigExam();
			const newList = list.map((item) => {
				if (item.id === id) {
					return { ...item, is_auto_register: isAuto };
				}
				return item;
			});
			await this.saveListConfigExam(newList);
			return true;
		} catch (error) {
			throw error;
		}
	},

	async getListStatusConfigExam(list: ConfigExamTarget[]) {
		try {
			const res: IStatusConfigExam[] = [];
			const promiseAll = [];
			list.forEach(async (item) => {
				if (item.id.includes(ID_TEST)) {
					return;
				}
				promiseAll.push(
					examRemoteService.checkExamResgistration({
						id: item.id,
						auth: item.auth,
						ma_cap_thi: item.exam_register.ma_cap_thi,
						ngay_mo_dang_ky: item.exam_register.ngay_mo_dang_ky,
					}),
				);
			});

			const results = await Promise.all(promiseAll);

			const handleGetStatusConfigExam = (
				id: string,
				is_registered: boolean,
				exams: ConfigExamTarget[],
			): IStatusConfigExam["status"] => {
				const exam = exams.find((i) => i.id === id);
				if (is_registered) {
					return "registered";
				}
				if (exam) {
					const now = Date.now();
					//format 2026-10-19 09:00:00
					const ngayMoDangKy = new Date(
						exam.exam_register.ngay_mo_dang_ky,
					).getTime();

					if (now < ngayMoDangKy) {
						return "waiting";
					}
				}

				return "failed";
			};

			list.forEach((item) => {
				if (item.id.includes(ID_TEST)) {
					res.push({
						id: item.id,
						status: item.status || "waiting",
					});
					return;
				}

				const result = results.find((i) => i.id === item.id);
				if (result) {
					res.push({
						id: item.id,
						status: handleGetStatusConfigExam(
							item.id,
							result.is_registered,
							list,
						),
					});
				}
			});

			return res;
		} catch (error) {
			throw error;
		}
	},

	async updateStatusConfigExam(id: string, status: TStatusConfigExam) {
		try {
			const list = await this.getListConfigExam();
			const newList = list.map((item) => {
				if (item.id === id) {
					return { ...item, status: status };
				}
				return item;
			});
			await this.saveListConfigExam(newList);
			return true;
		} catch (error) {
			throw error;
		}
	},

	async registerExam(payload: ConfigExamTarget) {
		//maybe need retry
		const maxTry = 4;

		let isAutoLoop = await storageService.getIsAutoLoop();

		async function sendMessageUpdateStatus(status: TStatusConfigExam) {
			await sendMessageFromBackground(
				KEY_MESSAGE_FROM_BACKGROUND.UPDATE_STATUS_CONFIG_EXAM,
				{ id: payload.id, status },
			);
		}

		async function register(payload: ConfigExamTarget, cntTry = 1) {
			try {
				isAutoLoop = await storageService.getIsAutoLoop();
				await sendMessageUpdateStatus("registering");
				//simulate error
				if (payload.id.includes(ID_TEST)) {
					await sleep(random(2000, 6000));
					if (cntTry <= 2) {
						throw new CustomError("Error test", 400);
					}
					await sendMessageUpdateStatus("registered");
					return {
						id: payload.id,
						is_registered: true,
					};
				}
				const res = await examRemoteService.registerExam({
					ma_cap_thi: payload.exam_register.ma_cap_thi,
					answers: [],
					ngay_mo_dang_ky: payload.exam_register.ngay_mo_dang_ky,
					auth: payload.auth,
				});
				if (res) {
					await sendMessageUpdateStatus("registered");
					return { id: payload.id, is_registered: true };
				}
				throw new CustomError("Fail register exam", 400);
			} catch (error) {
				logError("[Config Exam Service] Error when registerExam: ", error);

				const isInTimeDiff = schedulerService.getIsInTime(
					payload.exam_register.ngay_mo_dang_ky,
					600,
				); //in time 600s = 10 minutes

				if ((isAutoLoop && isInTimeDiff) || cntTry < maxTry) {
					await sendMessageUpdateStatus("error");
					await sleep(random(2000, 3500));
					return await register(payload, cntTry + 1);
				} else {
					await sendMessageUpdateStatus("failed");
					return { id: payload.id, is_registered: false };
				}
			}
		}

		try {
			console.log(payload);
			await sleep(random(1500, 2500));
			const res = await register(payload);
			if (!res.is_registered) {
				//try again
				await sleep(5000);
				return await register(payload);
			}
			return res;
		} catch (error) {
			logError("[Config Exam Service] Error when registerExam: ", error);
			return false;
		}
	},
};
