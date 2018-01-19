function logTabs(tabs) {
  for (let tab of tabs) {
    console.log(tab.url);
  }
}

function onError(error) {
  console.log(`Error: ${error}`);
}

var querying = browser.tabs.query({currentWindow: true});
querying.then(logTabs, onError);