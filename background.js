function logTabs(windowInfo) {
    return windowInfo.id;
}

function onError(error) {
  return;
}

browser.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if( request.message === "restore_session" ) {
    	request.urls.forEach(function(url){
            var winID = browser.windows.getLastFocused({"windowTypes": ["normal"]}).then(logTabs, onError);
            winID.then(function(result){
    			var createTab = browser.tabs.create({"windowId": result, "url": url});
    		});
    	});
    }
  }
);