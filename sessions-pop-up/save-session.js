let srConfig = {
    captureWindows: false
};

function onError(error) {
    console.error(`Error: ${error}`);
    const message = error.message || error;
    if (typeof M !== 'undefined' && M.toast) {
        M.toast({ html: `Error: ${message}`, classes: 'red' });
    } else {
        alert(`An error occurred: ${message}`);
    }
}

function showToast(message, classes = '') {
    if (typeof M !== 'undefined' && M.toast) {
        M.toast({ html: message, classes: classes });
    } else {
        console.log(message);
    }
}

function confirmAction(title, message) {
    return new Promise((resolve) => {
        const modalElement = document.querySelector('#_ao_confirm_modal');
        const modal = M.Modal.getInstance(modalElement);
        if (!modal) {
            resolve(confirm(message));
            return;
        }

        let confirmed = false;
        $('#_ao_confirm_title').text(title);
        $('#_ao_confirm_message').text(message);
        $('#_ao_confirm_yes_btn').off('click').on('click', () => {
            confirmed = true;
        });
        
        const options = {
            onCloseEnd: () => {
                resolve(confirmed);
            }
        };
        // Re-initialize or update options? Materialize 2.x might differ.
        // Usually we can just use the instance.
        modal.options.onCloseEnd = () => {
            resolve(confirmed);
        };
        modal.open();
    });
}

async function loadConfig() {
    try {
        const data = await browser.storage.local.get("config");
        if (data.config) {
            srConfig = { ...srConfig, ...data.config };
            $("#_ao_session_window_config").prop("checked", srConfig.captureWindows);
        }
    } catch (error) {
        onError(error);
    }
}

async function saveSession(tabs, sessionName) {
    const urls = tabs.map(tab => tab.url);
    await saveToStorage(urls, sessionName);
    $("#_ao_session_list").empty();
    await getSessions();
}

async function saveToStorage(urls, name) {
    try {
        const data = await browser.storage.local.get("sessions");
        const sessions = data.sessions || {};
        sessions[name] = urls;
        await browser.storage.local.set({ sessions });
    } catch (error) {
        onError(error);
    }
}

async function emptyStorage() {
    try {
        // Only clear sessions, keep config
        await browser.storage.local.set({ sessions: {} });
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

async function migrateOldSessions() {
    try {
        const store_data = await browser.storage.local.get();
        let sessions = store_data.sessions || {};
        let migrated = false;
        let keysToRemove = [];

        for (const [key, value] of Object.entries(store_data)) {
            if (key !== 'sessions' && key !== 'config' && Array.isArray(value)) {
                sessions[key] = value;
                keysToRemove.push(key);
                migrated = true;
            }
        }

        if (migrated) {
            await browser.storage.local.set({ sessions });
            await browser.storage.local.remove(keysToRemove);
            console.log('Migrated old sessions to new format.');
        }
    } catch (error) {
        console.error('Migration error:', error);
    }
}

async function getSessions() {
    try {
        const store_data = await browser.storage.local.get("sessions");
        let sessions = store_data.sessions || {};

        const $sessionList = $('#_ao_session_list');
        $sessionList.empty();

        const sessionKeys = Object.keys(sessions);
        if (sessionKeys.length === 0) {
            $sessionList.append('<li class="collection-item center-align _cao_no_sessions">No sessions saved yet.</li>');
            return;
        }

        for (const [key, urls] of Object.entries(sessions)) {
            const $li = $(`
            <li class="collection-item _cao_session_item">
                <p class="_cao_session_item_label"></p>
                <div>
                    <a class="btn waves-effect waves-light green tooltipped _cao_revive_btn" data-position="top" data-tooltip="Revive Session" alt="Revive Session"><i class="medium material-icons">open_in_new</i></a>
                    <a class="btn waves-effect waves-light red tooltipped _cao_delete_btn" data-position="top" data-tooltip="Delete Session" alt="Delete Session"><i class="medium material-icons">delete_forever</i></a>
                </div>
            </li>
            `);

            $li.find('._cao_session_item_label').text(key);
            $li.find('._cao_revive_btn').click(() => {
                restoreSession(urls);
                showToast(`Restoring ${urls.length} tabs...`, "blue");
            });
            $li.find('._cao_delete_btn').click(() => deleteSession(key));

            $sessionList.append($li);
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
    const confirmed = await confirmAction("Delete Session", `Are you sure you want to delete the session "${key}"?`);
    if (!confirmed) return;
    try {
        const data = await browser.storage.local.get("sessions");
        const sessions = data.sessions || {};
        delete sessions[key];
        await browser.storage.local.set({ sessions });
        await getSessions();
    } catch (error) {
        onError(error);
    }
}

async function addNewSession() {
    const sessionName = $("input[name=_ao_session_name]").val().trim();
    if (sessionName.length < 2) {
        showToast("Session name must be at least 2 characters long.", "orange");
        return;
    }

    try {
        const data = await browser.storage.local.get("sessions");
        const sessions = data.sessions || {};
        if (sessions[sessionName]) {
            showToast("A session with this name already exists.", "orange");
            return;
        }

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

$(document).ready(async function () {
    // Initialize Materialize components
    if (typeof M !== 'undefined') {
        M.Modal.init(document.querySelectorAll('.modal'));
        M.Tooltip.init(document.querySelectorAll('.tooltipped'));
    }

    await migrateOldSessions();
    await loadConfig();
    getSessions();
    $("#_ao_session_save_btn").click(() => addNewSession());
    $("#_ao_session_name").keypress((e) => {
        if (e.which === 13) {
            e.preventDefault();
            addNewSession();
        }
    });
    $("#_ao_session_window_config").click(async function () {
        srConfig.captureWindows = $(this).prop("checked");
        await browser.storage.local.set({ config: srConfig });
    });
    $("#_ao_session_delete_all_btn").click(async function () {
        const confirmed = await confirmAction("Delete All Sessions", "Are you sure you want to delete ALL saved sessions? This action cannot be undone.");
        if (confirmed) {
            await emptyStorage();
            await getSessions();
            showToast("All sessions deleted.", "green");
        }
    });
});