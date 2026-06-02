let srConfig = {
    captureWindows: false
};

function onError(error) {
    console.error(`Error: ${error}`);
    // Show a basic alert for user feedback as requested in review
    alert(`An error occurred: ${error.message || error}`);
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

async function getSessions() {
    try {
        const store_data = await browser.storage.local.get();
        let sessions = store_data.sessions || {};

        // Migration logic: if there are top-level keys that are not 'sessions' or 'config',
        // treat them as old sessions and migrate them.
        let migrated = false;
        for (const [key, value] of Object.entries(store_data)) {
            if (key !== 'sessions' && key !== 'config' && Array.isArray(value)) {
                sessions[key] = value;
                await browser.storage.local.remove(key);
                migrated = true;
            }
        }
        if (migrated) {
            await browser.storage.local.set({ sessions });
        }

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
            $li.find('._cao_revive_btn').click(() => restoreSession(urls));
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
    if (!confirm(`Are you sure you want to delete the session "${key}"?`)) return;
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
        alert("Session name must be at least 2 characters long.");
        return;
    }

    try {
        const data = await browser.storage.local.get("sessions");
        const sessions = data.sessions || {};
        if (sessions[sessionName]) {
            alert("A session with this name already exists.");
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
        if (confirm("Are you sure you want to delete ALL saved sessions? This action cannot be undone.")) {
            await emptyStorage();
            await getSessions();
        }
    });
});