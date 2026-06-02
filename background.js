browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "restore_session") {
        restoreSession(request.urls);
    }
});

async function restoreSession(urls) {
    try {
        const windowInfo = await browser.windows.getLastFocused({ windowTypes: ["normal"] });
        for (const url of urls) {
            await browser.tabs.create({ windowId: windowInfo.id, url: url });
        }
    } catch (error) {
        console.error(`Error restoring session: ${error}`);
    }
}