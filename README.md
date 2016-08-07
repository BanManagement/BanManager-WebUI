# BanManager-WebClient

This README outlines the details of collaborating on this Ember application.
A short introduction of this app could easily go here.

## Prerequisites

You will need the following things properly installed on your computer.

* [Git](http://git-scm.com/)
* [Node.js](http://nodejs.org/) (with NPM)
* [Bower](http://bower.io/)
* [Ember CLI](http://ember-cli.com/)
* [PhantomJS](http://phantomjs.org/)

## Installation

* `git clone -b spa git@github.com:BanManagement/BanManager-WebUI.git` this repository
* change into the new directory
* `npm install`
* `bower install`
* `npm i -g ember-cli knex`
* `ember serve`
* Setup the API
* `git clone git@github.com:BanManagement/BanManager-WebAPI.git`
* change into the new directory
* `npm install`
* Create a database, named bm_dev via root user by default
* create the tables `knex migrate:latest --env development --knexfile config.js`
* `node server.js`
* Create a server via an API request

```
POST http://localhost:60990/v1/server

{ "name": "Test"
, "host": "127.0.0.1"
, "database": "bm_dev"
, "user": "root"
, "console": "AEBA57B2D1384AD88969B73617C868CF"
, "tables":
  { "players": "bm_players"
  , "playerBans": "bm_player_bans"
  , "playerBanRecords": "bm_player_ban_records"
  , "playerMutes": "bm_player_mutes"
  , "playerMuteRecords": "bm_player_mute_records"
  , "playerKicks": "bm_player_kicks"
  , "playerNotes": "bm_player_notes"
  , "playerHistory": "bm_player_history"
  , "playerReports": "bm_player_reports"
  , "playerReportLocations": "bm_player_report_locations"
  , "playerReportStates": "bm_player_report_states"
  , "playerReportCommands": "bm_player_report_commands"
  , "playerReportComments": "bm_player_report_comments"
  , "playerWarnings": "bm_player_warnings"
  , "ipBans": "bm_ip_bans"
  , "ipBanRecords": "bm_ip_ban_records"
  , "ipMutes": "bm_ip_mutes"
  , "ipMuteRecords": "bm_ip_mute_records"
  , "ipRangeBans": "bm_ip_range_bans"
  , "ipRangeBanRecords": "bm_ip_range_ban_records"
  }
}
```

## Running / Development

* `ember server`
* Visit your app at [http://localhost:4200](http://localhost:4200).

### Code Generators

Make use of the many generators for code, try `ember help generate` for more details

### Running Tests

* `ember test`
* `ember test --server`

### Building

* `ember build` (development)
* `ember build --environment production` (production)

### Deploying

Specify what it takes to deploy your app.

## Further Reading / Useful Links

* [ember.js](http://emberjs.com/)
* [ember-cli](http://ember-cli.com/)
* Development Browser Extensions
  * [ember inspector for chrome](https://chrome.google.com/webstore/detail/ember-inspector/bmdblncegkenkacieihfhpjfppoconhi)
  * [ember inspector for firefox](https://addons.mozilla.org/en-US/firefox/addon/ember-inspector/)

