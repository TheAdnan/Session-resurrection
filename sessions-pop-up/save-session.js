const srConfig = {
    captureWindows: false
};

function onError(error) {
    console.error(`Error: ${error}`);
}

async function saveSession(tabs, sessionName) {
    const urls = tabs.map(tab => tab.url);
    await saveToStorage(urls, sessionName);
    $("#_ao_session_list").empty();
    await getSessions();
}

async function saveToStorage(urls, name) {
    try {
        await browser.storage.local.set({ [name]: urls });
    } catch (error) {
        onError(error);
    }
}

async function emptyStorage() {
    try {
        await browser.storage.local.clear();
    } catch (error) {
        onError(error);
    }
}

function restoreSession(urls) {
    browser.runtime.sendMessage({
        message: "restore_session",
        urls: urls
    });
}

async function getSessions() {
    try {
        const store_data = await browser.storage.local.get();
        const $sessionList = $('#_ao_session_list');
        for (const [key, urls] of Object.entries(store_data)) {
            const key_id = key.replace(/\s+/g, '-').toLowerCase();
            const $li = $(`
            <li id="${key_id}" class="collection-item _cao_session_item">
                <p class="_cao_session_item_label">${key}</p>
                <div>
                    <a id="${key_id}_label" class="btn waves-effect waves-light green tooltipped" data-position="top" data-tooltip="Revive Session" alt="Revive Session"><i class="medium material-icons">open_in_new</i></a>
                    <a id="${key_id}_btn" class="btn waves-effect waves-light red tooltipped" data-position="top" data-tooltip="Delete Session" alt="Delete Session"><i class="medium material-icons">delete_forever</i></a>
                </div>
            </li>
            `);
            $sessionList.append($li);

            $li.find(`#${key_id}_label`).click(() => restoreSession(urls));
            $li.find(`#${key_id}_btn`).click(() => deleteSession(key));
        }
        // Initialize tooltips
        if (typeof M !== 'undefined' && M.Tooltip) {
            M.Tooltip.init(document.querySelectorAll('.tooltipped'));
        }
    } catch (error) {
        onError(error);
    }
}

async function deleteSession(key) {
    try {
        await browser.storage.local.remove(key);
        const key_id = key.replace(/\s+/g, '-').toLowerCase();
        $(`#${key_id}`).remove();
    } catch (error) {
        onError(error);
    }
}

async function addNewSession() {
    const sessionName = $("input[name=_ao_session_name]").val().trim();
    if (sessionName.length < 2) return;

    try {
        let tabs;
        if (!srConfig.captureWindows) {
            tabs = await browser.tabs.query({ currentWindow: true });
        } else {
            const windows = await browser.windows.getAll({ populate: true, windowTypes: ["normal"] });
            tabs = windows.flatMap(win => win.tabs);
        }
        await saveSession(tabs, sessionName);
        $("input[name=_ao_session_name]").val("");
    } catch (error) {
        onError(error);
    }
}

$(document).ready(function () {
    getSessions();
    $("#_ao_session_save_btn").click(() => addNewSession());
    $("#_ao_session_name").keypress((e) => {
        if (e.which === 13) {
            e.preventDefault();
            addNewSession();
        }
    });
    $("#_ao_session_window_config").click(function () {
        srConfig.captureWindows = $(this).prop("checked");
    });
    $("#_ao_session_delete_all_btn").click(async function () {
        await emptyStorage();
        $('#_ao_session_list').empty();
    });
});