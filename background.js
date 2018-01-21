function logTabs(windowInfo) {
    return windowInfo.id;
}

function onError(error) {
  return;
}

var windowID = browser.windows.getLastFocused({"windowTypes": ["normal"]});
const winID = windowID.then(logTabs, onError);


browser.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if( request.message === "restore_session" ) {
    	request.urls.forEach(function(url){
    		winID.then(function(result){
    			var createTab = browser.tabs.create({"windowId": result, "url": url});
    		});
    	});
    }
  }
);