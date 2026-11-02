# Asistan

Two offline desktop tools (Electron, Turkish UI) for anaesthesiology residents: **Nöbet** builds the monthly on-call roster, **Görevlendirme** fills the mandatory posts left open after duty and leave, fairly and by seniority. Monthly data lives in the repo and syncs between machines through git.

## Install

Easiest: install from [Teknesyum Base](https://github.com/Teknesyum/Teknesyum-Base), or download `Asistan-Setup-<version>.exe` from the [latest release](https://github.com/Teknesyum/Asistan/releases/latest) and press **Kur**. No login is needed: the launcher clones this public repo and updates it on every start. Git must be installed.

One-line alternatives and the USB installer are described in [AGENTS.md](AGENTS.md).

## Updating

Both tools run `git pull` on start and every minute afterwards; when code files change the app restarts itself, when data changes the screen refreshes. Publishing a new launcher: `node Kurucu/yayinla.js --notlar "..."`.

## Data

`Görevlendirme/veri/` and `Nöbet/veri/` hold real schedules. Reading is open; writing needs a deploy key or GitHub sign-in with push rights.
