browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "restore_session") {
        restoreSession(request.urls);
    }
});

async function restoreSession(urls) {
    if (!urls || urls.length === 0) return;
    
    try {
        let windowInfo = await browser.windows.getLastFocused({ windowTypes: ["normal"] });
        
        if (!windowInfo) {
            const windows = await browser.windows.getAll({ windowTypes: ["normal"] });
            if (windows.length > 0) {
                windowInfo = windows[0];
            } else {
                windowInfo = await browser.windows.create({ url: urls[0] });
                urls = urls.slice(1);
            }
        }

        for (const url of urls) {
            await browser.tabs.create({ windowId: windowInfo.id, url: url });
        }
    } catch (error) {
        console.error(`Error restoring session: ${error}`);
    }
}