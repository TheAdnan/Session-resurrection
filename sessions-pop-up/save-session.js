var sessionTabs = [];

function saveSession(tabs) {
    for (let tab of tabs) {
        sessionTabs.push(tab.url.toString());
    }
    saveToStorage(sessionTabs, $("input[name=checkListItem]").val());
    $("input[name=checkListItem]").val("");
}

function onError(error) {
    return;
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
	gettingItem.then((store_data) => {
        for (const key of Object.keys(store_data)) {
            let key_id = key.replace(/\s+/g, '-').toLowerCase();
            $('.list').append(`
                <div class="item" id="${key_id}">
                    <span class="icon-arrow-right-circle" id="${key_id}_label"></span> ${key} 
                    <button class="button delete-session-btn" id="${key_id}_btn" data-key="${key_id}"><span class="icon-trash"></span> Delete</button>
                </div>
            `);
            $('#' + key_id).data(key, store_data[key]);
            $('#' + key_id + '_btn').data(key, store_data[key]);

            /* Click Event Listener : 
                Label > Restores the associated session
                Delete Button > Deletes the associated session
             */
            $('#' + key_id + '_label').click(function() {
                restoreSession($(this).data());
            });
            $('#' + key_id + '_btn').click(() => {
                let _delTarget = $('#' + key_id + '_btn').data();
                deleteSession(Object.keys(_delTarget)[0]);
            });
        }
    }, onError); //onGot
}

function deleteSession(key) {
    let q = browser.storage.local.get();
    q.then((data) => {
        console.log("FROM FUNC" ,data);
        if (data[key] != null) {
            console.log("Killing >> " + key);
            let ro = browser.storage.local.remove(key);
            ro.then(() => {
                let key_id = key.replace(/\s+/g, '-').toLowerCase();
                $('#' + key_id).remove();
            }, onError);
        }
    }, onError);
}

function addNewSession() {
    var toAdd = $("input[name=checkListItem]").val();
        if(toAdd.length < 2) return;
        else {
            $('.list').append(`
                <div class="item">
                    <span class="icon-arrow-right-circle"></span> ${toAdd}
                    <button class="button delete-session-btn"><span class="icon-trash"></span> Delete</button>
                </div>
            `);
            var querying = browser.tabs.query({
                currentWindow: true
            });
            querying.then(saveSession, onError);
        }
}

$(document).ready(function() {
    getSessions();
    $("#button").click(function() { 
        addNewSession();
    });

    $("#lists").keypress(function(e){
        if (e.which == 13) {
                e.preventDefault();
                addNewSession();
          }
    });

    $("#remove-sessions").click(function() { 
        emptyStorage();
        $('.list').empty();
    });

    // $(".delete-session-btn").click(() => {
    //     console.log($(".delete-session-btn").data());
    // });

    // $(document).on('click', '.item', function() {
    //     $(".item").click(function(){
    //     	restoreSession($(this).data());
    //     });
    // });
});
    
