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
    saveToStorage(sessionTabs, $("input[name=_ao_session_name]").val());
    $("input[name=_ao_session_name]").val("");
    $("#_ao_session_list").empty();
    getSessions();
}

function saveToStorage(element, name) {
    let setting = browser.storage.local.set({
        [name]: element
    });
    setting.then(() => {
        sessionTabs.length = 0;
    }, onError);
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
            $('#_ao_session_list').append(`
            <li id="${key_id}" class="collection-item _cao_session_item" style="">
                <p class="_cao_session_item_label">${key}</p>
                <div>
                    <a id="${key_id}_label" class="btn waves-effect waves-light green tooltipped" data-position="top" data-tooltip="Revive Session" alt="Revive Session"><i class="medium material-icons">open_in_new</i></a>
                    <a id="${key_id}_btn" class="btn waves-effect waves-light red tooltipped" data-position="top" data-tooltip="Delete Session" alt="Delete Session"><i class="medium material-icons">delete_forever</i></a>
                </div>
            </li>
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
    var toAdd = $("input[name=_ao_session_name]").val();
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
    $("#_ao_session_save_btn").click(() => addNewSession());
    $("#_ao_session_name").keypress((e) => {
        if (e.which == 13) {
            e.preventDefault();
            addNewSession();
        }
    });
    $("#_ao_session_window_config").click(function () {
        if ($(this).prop("checked") == true) {
            srConfig.captureWindows = true;
        } else if ($(this).prop("checked") == false) {
            srConfig.captureWindows = false;
        }
    });
    $("#_ao_session_delete_all_btn").click(function () {
        emptyStorage();
        $('#_ao_session_list').empty();
    });
});