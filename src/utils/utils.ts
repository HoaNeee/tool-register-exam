function checkIsDashboardTab(url: string) {
	if (!url) {
		url = location.href;
	}
	//chrome-extension://kjolgeeheogjkbckoenbbfiolfnhblln/index.html
	const pattern = /chrome-extension:\/\/.*\/index.html/;
	return pattern.test(url);
}

function genID(length = 10) {
	let result = "";
	const characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

function logActions(...args: unknown[]) {
	console.log(...args);
}

function logError(...args: unknown[]) {
	console.log(...args);
}

async function sleep(duration: number) {
	return new Promise((resolve) => setTimeout(resolve, duration));
}

function random(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export { checkIsDashboardTab, genID, logActions, logError, random, sleep };
