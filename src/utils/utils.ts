function checkIsDashboardTab() {
  const href = location.href;
  //chrome-extension://kjolgeeheogjkbckoenbbfiolfnhblln/index.html
  const pattern = /chrome-extension:\/\/.*\/index.html/;
  return pattern.test(href);
}

export { checkIsDashboardTab };
