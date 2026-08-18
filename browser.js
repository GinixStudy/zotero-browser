ZoteroBrowser = {
    id: null,
    version: null,
    rootURI: null,
    registeredPaneID: null,

    init({ id, version, rootURI }) {
        this.id = id;
        this.version = version;
        this.rootURI = rootURI;
    },

    log(msg) {
        Zotero.debug("Zotero Browser: " + msg);
    },

    addToAllWindows() {
        for (const win of Zotero.getMainWindows()) {
            this.addToWindow(win);
        }
    },

    removeFromAllWindows() {
        for (const win of Zotero.getMainWindows()) {
            this.removeFromWindow(win);
        }
    },

    addToWindow(win) {
        win.MozXULElement?.insertFTLIfNeeded("zotero-browser.ftl");
    },

    removeFromWindow(win) {
        const doc = win.document;

        for (const root of doc.querySelectorAll(".zotero-browser-direct-root")) {
            root.remove();
        }

        doc.querySelector(
            'link[rel="localization"][href="zotero-browser.ftl"]'
        )?.remove();
    },

    registerSection() {
        if (this.registeredPaneID) return;

        const deerIcon = this.rootURI + "icons/magic-deer-64.png";

        this.registeredPaneID = Zotero.ItemPaneManager.registerSection({
            paneID: "browser",
            pluginID: this.id,

            header: {
                l10nID: "zotero-browser-section-title",
                icon: deerIcon,
                darkIcon: deerIcon
            },

            sidenav: {
                l10nID: "zotero-browser-section-tooltip",
                icon: deerIcon,
                darkIcon: deerIcon,
                orderable: true
            },

            /*
             * Zotero 9.0.6 can hand onRender() a detached cached body node.
             * We therefore use onRender only as the lifecycle signal and
             * attach the browser UI directly to the connected
             * <item-pane-custom-section>.
             */
            onRender: (props) => {
                this.renderIntoConnectedSection(props);
            }
        });

        if (!this.registeredPaneID) {
            throw new Error("Failed to register Zotero Browser item-pane section");
        }

        this.log("Registered item-pane section: " + this.registeredPaneID);
    },

    unregisterSection() {
        for (const win of Zotero.getMainWindows()) {
            for (const root of win.document.querySelectorAll(
                ".zotero-browser-direct-root"
            )) {
                root.remove();
            }
        }

        if (!this.registeredPaneID) return;

        Zotero.ItemPaneManager.unregisterSection(this.registeredPaneID);
        this.registeredPaneID = null;
    },

    renderIntoConnectedSection({ doc, paneID, item, tabType }) {
        const itemID = item?.id ?? null;

        const targets = [...doc.querySelectorAll("item-pane-custom-section")]
            .filter(elem => {
                if (!elem.isConnected) return false;
                if (elem.dataset.pane !== paneID) return false;

                if (tabType && elem.tabType && elem.tabType !== tabType) {
                    return false;
                }

                if (
                    itemID !== null &&
                    elem.item?.id !== undefined &&
                    elem.item.id !== itemID
                ) {
                    return false;
                }

                return true;
            });

        if (!targets.length) {
            this.log(
                `No connected section found for pane=${paneID}, tabType=${tabType}`
            );
            return;
        }

        for (const target of targets) {
            this.attachBrowser(target);
        }
    },

    attachBrowser(target) {
        if (
            [...target.children].some(
                child => child.classList?.contains("zotero-browser-direct-root")
            )
        ) {
            return;
        }

        const doc = target.ownerDocument;
        const win = doc.defaultView;
        const NS = "http://www.w3.org/1999/xhtml";

        const root = doc.createElementNS(NS, "div");
        root.className = "zotero-browser-direct-root";

        Object.assign(root.style, {
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "720px",
            minHeight: "400px",
            boxSizing: "border-box",
            overflow: "hidden",
            background: "Canvas",
            color: "CanvasText"
        });

        const toolbar = doc.createElementNS(NS, "div");

        Object.assign(toolbar.style, {
            display: "flex",
            alignItems: "center",
            gap: "5px",
            height: "40px",
            minHeight: "40px",
            boxSizing: "border-box",
            padding: "6px",
            borderBottom: "1px solid #666",
            background: "Canvas"
        });

        const back = this.makeButton(doc, NS, "←", "后退");
        const forward = this.makeButton(doc, NS, "→", "前进");
        const reload = this.makeButton(doc, NS, "↻", "刷新");

        const input = doc.createElementNS(NS, "input");
        input.type = "text";
        input.value = "https://www.google.com/";
        input.setAttribute("aria-label", "Address");

        Object.assign(input.style, {
            flex: "1 1 auto",
            minWidth: "0",
            height: "28px",
            boxSizing: "border-box",
            padding: "4px 8px"
        });

        toolbar.append(back, forward, reload, input);

        const browser = doc.createXULElement("browser");
        browser.setAttribute("type", "content");
        browser.setAttribute("remote", "false");
        browser.setAttribute("disableglobalhistory", "true");
        browser.setAttribute("maychangeremoteness", "true");

        Object.assign(browser.style, {
            display: "block",
            width: "100%",
            height: "auto",
            minHeight: "0",
            flex: "1 1 auto"
        });

        const resizeHandle = doc.createElementNS(NS, "div");
        resizeHandle.title = "上下拖动调整浏览器高度";

        Object.assign(resizeHandle.style, {
            height: "8px",
            minHeight: "8px",
            flex: "0 0 8px",
            cursor: "ns-resize",
            borderTop: "1px solid #666",
            boxSizing: "border-box",
            userSelect: "none"
        });

        root.append(toolbar, browser, resizeHandle);
        target.appendChild(root);

        const loadURL = value => {
            let url = value.trim();
            if (!url) return;

            if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) {
                url = "https://" + url;
            }

            input.value = url;

            try {
                browser.loadURI(
                    Services.io.newURI(url),
                    {
                        triggeringPrincipal:
                            Services.scriptSecurityManager.getSystemPrincipal()
                    }
                );
            }
            catch (err) {
                this.log("Load failed: " + err);
            }
        };

        input.addEventListener("keydown", event => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            loadURL(input.value);
        });

        back.addEventListener("click", () => {
            try {
                browser.goBack();
            }
            catch (err) {
                this.log("Back failed: " + err);
            }
        });

        forward.addEventListener("click", () => {
            try {
                browser.goForward();
            }
            catch (err) {
                this.log("Forward failed: " + err);
            }
        });

        reload.addEventListener("click", () => {
            try {
                browser.reload();
            }
            catch (err) {
                this.log("Reload failed: " + err);
            }
        });

        browser.addEventListener("load", () => {
            try {
                const url = browser.currentURI?.spec;
                if (url && url !== "about:blank") {
                    input.value = url;
                }
            }
            catch (_) {}
        }, true);

        this.bindHeightResize({
            doc,
            root,
            browser,
            handle: resizeHandle
        });

        win.setTimeout(() => {
            loadURL(input.value);
        }, 0);

        this.log(
            `Attached browser to connected section; tabType=${target.tabType}, item=${target.item?.id}`
        );
    },

    makeButton(doc, NS, text, title) {
        const button = doc.createElementNS(NS, "button");
        button.type = "button";
        button.textContent = text;
        button.title = title;

        Object.assign(button.style, {
            width: "32px",
            minWidth: "32px",
            height: "28px"
        });

        return button;
    },

    bindHeightResize({ doc, root, browser, handle }) {
        let startY = 0;
        let startHeight = 0;

        handle.addEventListener("pointerdown", event => {
            event.preventDefault();

            startY = event.clientY;
            startHeight = root.getBoundingClientRect().height;

            handle.setPointerCapture(event.pointerId);
            browser.style.pointerEvents = "none";
            doc.documentElement.style.cursor = "ns-resize";
        });

        handle.addEventListener("pointermove", event => {
            if (!handle.hasPointerCapture(event.pointerId)) {
                return;
            }

            const delta = event.clientY - startY;
            const nextHeight = Math.max(
                400,
                Math.min(1600, startHeight + delta)
            );

            root.style.height = nextHeight + "px";
        });

        const stopResize = event => {
            if (handle.hasPointerCapture(event.pointerId)) {
                handle.releasePointerCapture(event.pointerId);
            }

            browser.style.pointerEvents = "";
            doc.documentElement.style.cursor = "";
        };

        handle.addEventListener("pointerup", stopResize);
        handle.addEventListener("pointercancel", stopResize);
    }
};
