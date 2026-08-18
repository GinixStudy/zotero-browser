# Zotero Browser

A lightweight embedded web browser for Zotero's Item Pane.

**Tested with Zotero 9.0.6.**

## Features

- Native Zotero Item Pane integration
- Magical deer sidebar icon
- Embedded web browser
- Address bar
- Back / Forward / Reload
- Enter-to-navigate
- Drag the bottom edge to resize browser height
- Default height: 720 px

## Install

Download the XPI package and install it from **Zotero → Tools → Plugins**.

## Privacy

This source code does **not** contain Google accounts, passwords, cookies,
login tokens, API keys, or personal browser credentials.

If Google or another site appears already signed in, that session comes from
the user's local Zotero browser environment. It is not stored in this repository.

## Compatibility

Currently tested on Zotero 9.0.6. The manifest intentionally limits compatibility
to Zotero 9.0.* until additional versions are tested.

## License

This project is licensed for **non-commercial use** under the
**PolyForm Noncommercial License 1.0.0**.

Commercial use is not permitted under this license without separate written
permission from the copyright holder.

See the `LICENSE` file for the applicable terms.

Copyright © 2026 GinixStudy.

## v0.3.3

Fixed Zotero installation validation by restoring the required
`applications.zotero.update_url` and pointing it to this repository's
`updates.json`.
