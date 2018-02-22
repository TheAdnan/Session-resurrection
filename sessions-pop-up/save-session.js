var sessionTabs = [];

function saveSession(tabs) {
    for (let tab of tabs) {
        sessionTabs.push(tab.url.toString());
    }
    saveToStorage(sessionTabs, $("input[name=checkListItem]").val());
}

function onError(error) {
    return;
}

function onGot(items) {
    Object.keys(items).forEach(function(key) {
      key_id = key.replace(/\s+/g, '-').toLowerCase();
	  $('.list').append('<div class="item" id="' + key_id + '"><span class="icon-arrow-right-circle"></span> ' + key + "</div>");
	  $('#' + key_id).data(key, items[key]);
	});
}

function saveToStorage(element, name){
    let setting = browser.storage.local.set({[name]: element});
    setting.then(null, onError);
}

function emptyStorage(){
    let emptying = browser.storage.local.clear();
    emptying.then(null, onError);
}

 function restoreSession(data){
 	Object.keys(data).forEach(function(key){
		browser.runtime.sendMessage({"message": "restore_session", "urls": data[key]});
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
        if(toAdd.length < 2){
            return;
        }
        else{
            $('.list').append('<div class="item"><span class="icon-arrow-right-circle"></span> ' + toAdd + '</div>');
            var querying = browser.tabs.query({
                currentWindow: true
            });
            querying.then(saveSession, onError);
        }
    });

    $("#lists").keypress(function(e){
        if (e.which == 13) {
                var toAdd = $("input[name=checkListItem]").val();
                if(toAdd.length < 2){
                    return;
                }
                else{
                    $('.list').append('<div class="item"><span class="icon-arrow-right-circle"></span> ' + toAdd + '</div>');
                    var querying = browser.tabs.query({
                        currentWindow: true
                    });
                    querying.then(saveSession, onError);
                }
          }
    });

    $("#remove-sessions").click(function() { 
        emptyStorage();
        $('.list').empty();
    });
    $(document).on('click', '.item', function() {
        $(".item").click(function(){
        	restoreSession($(this).data());
        });
    });
});
    
