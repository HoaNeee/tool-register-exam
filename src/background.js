chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: "index.html",
  });
});

console.log("[Background] Background is running...");

console.log(typeof chrome);
