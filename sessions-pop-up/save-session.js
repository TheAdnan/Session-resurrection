var sessionTabs = [];

function saveSession(tabs) {
    for (let tab of tabs) {
        sessionTabs.push('"' + tab.url + '"');
    }
    saveToStorage(sessionTabs, $("input[name=checkListItem]").val());
}

function onError(error) {
    console.log(`Error: ${error}`);
}

function onGot(items) {
    Object.keys(items).forEach(function(key) {
      key_id = key.replace(/\s+/g, '-').toLowerCase();
	  $('.list').append('<div class="item" id="' + key_id + '">' + key + "</div>");
	  $('#' + key_id).data(key, items[key]);
	});
}

function saveToStorage(element, name){
    let setting = browser.storage.local.set({[name]: element});
    setting.then(null, onError);
}

 function restoreSession(data){
 	Object.keys(data).forEach(function(key){
 		data[key].forEach(function(element){
 			browser.tabs.create({
    			url: element
 			 });	
 		});
 	});
 }

function getSessions(){
	let gettingItem = browser.storage.local.get();
	gettingItem.then(onGot, onError);
}

$(document).ready(function() {
    getSessions();
    $("#button").click(function() { 
        var toAdd = $("input[name=checkListItem]").val();
        $('.list').append('<div class="item">' + toAdd + "</div>");
        var querying = browser.tabs.query({
            currentWindow: true
        });
        querying.then(saveSession, onError);
    });
    $(document).on('click', '.item', function() {
        $(".item").click(function(){
        	restoreSession($(this).data());
        });
    });
});
    
