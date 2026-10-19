import { KEY_ALARM_NAME } from "@/constants/constants";
import { logActions, logError } from "@/utils/utils";
import { configExamService } from "./config-exam-service";
import { storageService } from "./storage-service";

export const schedulerService = {
	async createSchedulerAlarm(time?: number) {
		try {
			if (!time) {
				return;
			}

			logActions(
				"create scheduler alarm for " + new Date(time).toLocaleString(),
			);

			await chrome.alarms.create(KEY_ALARM_NAME, {
				when: time,
			});
		} catch (error) {
			logError("[Scheduler Service] Error when createSchedulerAlarm: ", error);
		}
	},

	async clearSchedulerAlarm() {
		logActions("Clear scheduler alarm");
		await chrome.alarms.clear("TEST_ALARM");
		await chrome.alarms.clear(KEY_ALARM_NAME);
	},

	async clearAndCreateSchedulerAlarm() {
		try {
			await this.clearSchedulerAlarm();
			const nextTime = await this.getNextAlarmTime();
			if (!nextTime) {
				logActions("No next alarm time");
				return;
			}

			await this.createSchedulerAlarm(nextTime);
		} catch (error) {
			logError(
				"[Scheduler Service] Error when clearAndCreateSchedulerAlarm: ",
				error,
			);
		}
	},

	async getNextAlarmTime() {
		try {
			const listConfig = await configExamService.getListConfigExam();
			const is_auto_all = await storageService.getIsAutoRegisterAll();

			const dates = listConfig
				.filter(
					(item) =>
						(item.is_auto_register || is_auto_all) &&
						item.exam_register.ngay_mo_dang_ky,
				)
				.map((item) => {
					const date = new Date(item.exam_register.ngay_mo_dang_ky).getTime();
					return date;
				})
				.filter((item) => {
					const add = 1000 * 2; //2s
					return item > Date.now() + add;
				})
				.sort((a, b) => a - b);

			if (dates.length) return dates[0];

			return null;
		} catch (error) {
			logError("[Scheduler Service] Error when getNextAlarmTime: ", error);
			return null;
		}
	},

	getIsInTime(time: string | number, diff = 2) {
		console.log(time);
		time = new Date(time).getTime();
		const now = Date.now();

		const diffTime = 1000 * diff; //2s

		const res = now - time;

		if (res >= 0 && res < diffTime) return true;

		return false;
	},
};
