function logTabs(windowInfo) {
    return windowInfo.id;
}

function onError(error) {
  console.log(`Error: ${error}`);
}

var windowID = browser.windows.getLastFocused({"windowTypes": ["normal"]});
const winID = windowID.then(logTabs, onError);


browser.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if( request.message === "restore_session" ) {
    	// browser.windows.create({
    	// 	url: request.urls,
    	// 	type: "normal"
    	// });

    	request.urls.forEach(function(url){
    		winID.then(function(result){
    			browser.tabs.create({"windowId": result, "url": url});
    		});
    	});
    }
  }
);