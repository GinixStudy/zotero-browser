var ZoteroBrowser;

function log(msg) {
    Zotero.debug("Zotero Browser: " + msg);
}

function install() {
    log("Installed");
}

async function startup({ id, version, rootURI }) {
    log("Starting " + version);

    Services.scriptloader.loadSubScript(rootURI + "browser.js");

    ZoteroBrowser.init({ id, version, rootURI });
    ZoteroBrowser.addToAllWindows();
    ZoteroBrowser.registerSection();
}

function onMainWindowLoad({ window }) {
    ZoteroBrowser?.addToWindow(window);
}

function onMainWindowUnload({ window }) {
    ZoteroBrowser?.removeFromWindow(window);
}

function shutdown() {
    log("Shutting down");
    ZoteroBrowser?.unregisterSection();
    ZoteroBrowser?.removeFromAllWindows();
    ZoteroBrowser = undefined;
}

function uninstall() {
    log("Uninstalled");
}
