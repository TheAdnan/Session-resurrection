var srConfig = {
    captureWindows: false
}
var sessionTabs = [];

function onError(error) {
    return;
}

/**Utility Functions :
    saveSession : saves the new session by calling saveToStorage
    getSessions : loads the list of all stored sessions + Contains event handler for rendered HTML elements.
    deleteSession : deletes an individual session by taking its key. Called by DELETE button's click event handler
    addNewSession : Collects the session data from the browser, and passes it to saveSession for actual storing.
    restoreSession : restores session by delegating data to background.js

  *Storage Functions :
    emptyStorage : empties all the saved sessions.
    saveToStorage : stores the recieved session data @ browser.storage.local
    */

function saveSession(tabs) {
    for (let tab of tabs) {
        sessionTabs.push(tab.url.toString());
    }
    saveToStorage(sessionTabs, $("input[name=checkListItem]").val());
    $("input[name=checkListItem]").val("");
    $(".list").empty();
    getSessions();
}

function saveToStorage(element, name) {
    let setting = browser.storage.local.set({
        [name]: element
    });
    setting.then(null, onError);
}

function emptyStorage() {
    let emptying = browser.storage.local.clear();
    emptying.then(null, onError);
}

function restoreSession(data) {
    Object.keys(data).forEach(function (key) {
        browser.runtime.sendMessage({
            "message": "restore_session",
            "urls": data[key]
        });
    });
}

function getSessions() {
    let gettingItem = browser.storage.local.get();
    gettingItem.then((store_data) => {
        for (const key of Object.keys(store_data)) {
            let key_id = key.replace(/\s+/g, '-').toLowerCase();
            $('.list').append(`
                <div class="item" id="${key_id}">
                    <span class="icon-arrow-right-circle" id="${key_id}_label"></span> ${key} 
                    <button class="button delete-session-btn" id="${key_id}_btn"><span class="icon-trash"></span> Delete</button>
                </div>
            `);
            $('#' + key_id).data(key, store_data[key]);
            $('#' + key_id + '_btn').data(key, store_data[key]);
            $('#' + key_id + '_label').data(key, store_data[key]);

            /* Click Event Listener :
                Label > Restores the associated session (delegating to background.js)
                Delete Button > Deletes the associated session
             */
            $('#' + key_id + '_label').click(() => {
                restoreSession($('#' + key_id + '_label').data());
            });
            $('#' + key_id + '_btn').click(() => {
                let _delTarget = $('#' + key_id + '_btn').data();
                deleteSession(Object.keys(_delTarget)[0]);
            });
        }
    }, onError);
}

function deleteSession(key) {
    let q = browser.storage.local.get();
    q.then((data) => {
        if (data[key] != null) {
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
    if (toAdd.length < 2) return;
    else {
        if (srConfig.captureWindows == false) {
            var urlsFromCurrentWindows = browser.tabs.query({
                currentWindow: true
            });
            urlsFromCurrentWindows.then(saveSession, onError);
        } else {
            var urlsFromAllWindows = browser.windows.getAll({
                populate: true,
                windowTypes: ["normal"]
            });
            urlsFromAllWindows.then((windowInfoArray) => {
                let tabList = [];
                for (windowInfo of windowInfoArray) { // go through every window
                    for (tab in windowInfo.tabs) { // go through every in a window tab
                        tabList.push(windowInfo.tabs[tab]);
                    }
                }
                saveSession(tabList);
            }, onError);
        }
    }
}

$(document).ready(function () {
    getSessions();
    $("#button").click(() => addNewSession());
    $("#lists").keypress((e) => {
        if (e.which == 13) {
            e.preventDefault();
            addNewSession();
        }
    });
    $("#window-config").click(function () {
        if ($(this).prop("checked") == true) {
            srConfig.captureWindows = true;
        } else if ($(this).prop("checked") == false) {
            srConfig.captureWindows = false;
        }
    });
    $("#remove-sessions").click(function () {
        emptyStorage();
        $('.list').empty();
    });
});