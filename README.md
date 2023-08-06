<p align="center">
  <a href="https://banmanagement.com">
    <img src="https://banmanagement.com/images/banmanager-icon.png" height="128">
    <h1 align="center">BanManager WebUI</h1>
  </a>
</p>

<h3 align="center">
	Modern web client designed for self-hosting
</h3>

<p align="center">
	<strong>
		<a href="https://banmanagement.com">Website</a>
		|
		<a href="https://banmanagement.com/docs/webui/install">Docs</a>
		|
		<a href="https://demo.banmanagement.com">Demo</a>
	</strong>
</p>
<p align="center">
  <a aria-label="Tests status" href="https://github.com/BanManagement/BanManager-WebUI/actions/workflows/build.yaml">
    <img alt="" src="https://img.shields.io/github/actions/workflow/status/BanManagement/BanManager-WebUI/build.yaml?label=Tests&style=for-the-badge&labelColor=000000">
  </a>
  <a aria-label="License" href="https://github.com/BanManagement/BanManager-WebUI/blob/master/LICENSE">
    <img alt="" src="https://img.shields.io/github/license/BanManagement/BanManager-WebUI?labelColor=000&style=for-the-badge">
  </a>
  <a aria-label="Join the community on Discord" href="https://discord.gg/59bsgZB">
    <img alt="" src="https://img.shields.io/discord/664808009393766401?label=Support&style=for-the-badge&labelColor=000000&color=7289da">
  </a>
</p>

<p align="center">
  <a aria-label="Demo" href="https://demo.banmanagement.com">
	  <img src="https://github.com/BanManagement/BanManager-WebUI/blob/assets/welcome.png?raw=true" width="550">
  </a>
</p>

## Overview
- **Always connected.** Manage punishments from anywhere with seamless logins
- **Cross platform.** It doesn't matter what OS you use, it just works wherever Node.js runs
- **Responsive interface.** Manage your community from any device at any time

To learn more about configuration, usage and features of BanManager, take a look at [the website](https://banmanagement.com/) or view [the demo](https://demo.banmanagement.com).

## Features
- Appeal punishments
- Ban, unban, mute, and warn players
- Review and manage reports on the go
- Custom roles and flexible permissions
- A single interface for multiple Minecraft servers

## Requirements
- The latest [Node.js](https://nodejs.org/) LTS version (even numbered)
- MySQL v5+ or MariaDB v10+
- Minecraft server with [BanManager](https://github.com/BanManagement/BanManager) & [BanManager-WebEnhancer](https://ci.frostcast.net/job/BanManager-WebEnhancer/) plugins configured to [use MySQL or MariaDB](https://banmanagement.com/docs/banmanager/install#setup-shared-database-optional)

## Installation
See [setup instructions](https://banmanagement.com/docs/webui/install)

## Development
```
git clone git@github.com:BanManagement/BanManager-WebUI.git
npm install
npm run setup
npm run dev
```

## Contributing
If you'd like to contribute, please fork the repository and use a feature branch. Pull requests are warmly welcome.

## Help / Bug / Feature Request
If you have found a bug please [open an issue](https://github.com/BanManagement/BanManager-WebUI/issues/new) with as much detail as possible, including relevant logs and screenshots where applicable

Have an idea for a new feature? Feel free to [open an issue](https://github.com/BanManagement/BanManager-WebUI/issues/new) or [join us on Discord](https://discord.gg/59bsgZB) to chat

## License
Free to use under the [MIT](LICENSE)

## Screenshots
Click to view

### Home
[![Home](https://github.com/BanManagement/BanManager-WebUI/blob/assets/welcome.png?raw=true)](welcome.png)

### Player
[![Player](https://github.com/BanManagement/BanManager-WebUI/blob/assets/player.png?raw=true)](player.png)

### Dashboard
[![Dashboard](https://github.com/BanManagement/BanManager-WebUI/blob/assets/dashboard.png?raw=true)](dashboard.png)

### Appeal
[![Appeal](https://github.com/BanManagement/BanManager-WebUI/blob/assets/appeal.png?raw=true)](appeal.png)

### Report
[![Report](https://github.com/BanManagement/BanManager-WebUI/blob/assets/report.png?raw=true)](report.png)
