<?php
/*
 *  BanManagement © 2015, a web interface for the Bukkit plugin BanManager
 *  by James Mortemore of http://www.frostcast.net
 *  is licenced under a Creative Commons
 *  Attribution-NonCommercial-ShareAlike 2.0 UK: England & Wales.
 *  Permissions beyond the scope of this licence
 *  may be available at http://creativecommons.org/licenses/by-nc-sa/2.0/uk/.
 *  Additional licence terms at https://raw.githubusercontent.com/BanManagement/BanManager-WebUI/master/LICENSE
 */

/**
* This is the general configuaration file for Ban Management.
* In here you can control your encoding for server transfers,
* define what tables you want enabled, set your password for ACP,
* and more.
**/

date_default_timezone_set("Europe/Berlin"); // Set default timezone for date()

$settings['debug']['sqlcache'] = false; // show and var_dump any cached SQL queries
$settings['debug']['functiontest'] = false; // check for neccessary PHP functions
$settings['debug']['error_reporting'] = false; // display PHP errors
$settings['debug']['error_reporting_level'] = E_ALL; // Set error level (E_ALL, E_ERROR, E_WARNING, E_NOTICE)

$settings['utf8'] = true; // Encoding (Recommended TRUE)
$settings['latest_bans'] = true;  // Latest Bans table
$settings['latest_mutes'] = true; // Latest Mutes table
$settings['latest_warnings'] = true; // Latest warnings table
$settings['servers'] = '';
$settings['iframe_protection'] = true; // If true, you won't be able to <iframe> this web interface
$settings['password'] = 'password'; // ACP Password (Keep it strong)
$settings['footer'] = '&copy; Your Server '.date('Y'); // Footer for all pages
$settings['admin_link'] = true; // Show the admin link in the footer of all page
$settings['bm_info'] = true; // Show ban management infomation aside 'Account Status'
$settings['bm_info_icon'] = true; // Show the 'info' icon next to the title of bm_info
$settings['pastbans'] = true; // Show amount of players banned under the search

$settings['player_current_ban'] = true;
$settings['player_current_mute'] = true;
$settings['player_previous_bans'] = true;
$settings['player_previous_mutes'] = true;
$settings['player_kicks'] = true;
$settings['player_warnings'] = true;
$settings['player_current_ban_extra_html'] = '';
$settings['player_current_mute_extra_html'] = '';

// Turn to false, if you want to show accociated accounts for everyone, without authentication
$settings['associated_accounts_only_for_admins'] = true;

$settings['widget_bans_count'] = 5;
$settings['widget_mutes_count'] = 5;
$settings['widget_warnings_count'] = 5;

// Caching options per action, in seconds
$settings['cache_viewplayer'] = 600;
$settings['cache_viewip'] = 600;
$settings['cache_statistics'] = 3600;
$settings['cache_search'] = 600;
$settings['cache_home'] = 60;

// Skin service options
// ("%name%" is the placeholder for the player %name)
// ("%uuid%" is the placeholder for the player uuid)
$settings['skin']['helm'] = "https://crafatar.com/avatars/%uuid%?helm&size=24";
$settings['skin']['complete'] = "https://crafatar.com/renders/body/%uuid%?helm&scale=7";

/**
* These are the language options for Ban Management
**/

$language = array(
  'general' => array(
    'brand' => 'Ban Management',
    'meta-author' => 'Frostcast',
    'meta-description' => '',
    'title' => 'Ban Management by Frostcast',
    'nav-home' => 'Home',
    'nav-stats' => 'Statistics',
  ),
  'home' => array(
    'header-title' => 'Account Status',
    'search-player' => 'Player',
    'search-ip' => 'IP Address',
    'button-search' => 'Search',
    'button-display' => 'Display All',
    'bm_info_text' => 'Ban Management is a ban and mute system that allows players to check if and why they were banned, muted or warned and by whom.',
    'past_player_bans' => 'Past Player Bans',
    'latest_bans' => 'Recent Bans',
    'latest_mutes' => 'Recent Mutes',
    'latest_warnings' => 'Recent Warnings',
    'no_records' => 'No records',
  ),
  'stats' => array(
    'header-title' => 'Ban Statistics',
    'server' => 'Server',
    'current_tmp_bans' => 'Current Temporary Bans',
    'current_perm_bans' => 'Current Permanent Bans',
    'past_bans' => 'Past Bans',
  ),
  'admin' => array(
    'login-header' => 'Admin Control Panel',
    'login-description' => 'If you forgot your password please refer to settings.php to change it.',
    'login-password' => 'Password',
    'login-button-signin' => 'Sign In',
    'fail-wrong_password' => 'Wrong password. Please <a href="index.php?action=admin">try again</a>.',
    'update-alert' => '<strong>Update available!</strong> You are currently using version <code>{{your.version}}</code>. Click here to download the latest version <code>{{new.version}}</code>: <a href="https://github.com/BanManagement/BanManager-WebUI/releases">https://github.com/BanManagement/BanManager-WebUI/releases</a>',
    'server-name' => 'Server Name',
    'server-options' => 'Options',
    'server-button-add' => 'Add Server',
    'server-none' => 'No Servers Defined',
    'addserver-header' => 'Add Server',
    'addserver-server-name' => 'Server Name',
    'addserver-mysql-host' => 'MySQL Host',
    'addserver-mysql-database' => 'MySQL Database',
    'addserver-mysql-username' => 'MySQL Username',
    'addserver-mysql-password' => 'MySQL Password',
    'addserver-table-players' => 'Players Table',
    'addserver-table-player-bans' => 'Player Bans Table',
    'addserver-table-player-ban-records' => 'Player Ban Records Table',
    'addserver-table-player-mutes' => 'Player Mutes Table',
    'addserver-table-player-mute-records' => 'Player Mute Records Table',
    'addserver-table-player-kicks' => 'Player Kicks Table',
    'addserver-table-player-warnings' => 'Player Warnings Table',
    'addserver-table-ipbans' => 'IP Bans Table',
    'addserver-table-ipban-records' => 'IP Ban Records Table',
    'addserver-button-close' => 'Close',
    'addserver-button-save' => 'Save',
    'homepage-header' => 'Homepage Settings',
    'homepage-description' => 'You may find more settings in settings.php',
    'homepage-option' => 'Option',
    'homepage-value' => 'Value',
    'homepage-iframe_protection' => 'iFrame Protection (Recommended)',
    'homepage-utf8' => 'UTF8',
    'homepage-footer' => 'Footer',
    'homepage-latest_bans' => 'Latest Bans',
    'homepage-latest_mutes' => 'Latest Mutes',
    'homepage-latest_warnings' => 'Latest Warnings',
    'homepage-html-before' => 'HTML Before Buttons',
    'homepage-html-after' => 'HTML After Buttons',
    'homepage-button-save' => 'Save',
    'viewplayer-header' => 'View Player Settings',
    'viewplayer-visible' => 'Visible',
    'viewplayer-value' => 'Value',
    'viewplayer-current_ban' => 'Current Ban',
    'viewplayer-current_ban-html' => 'Current Ban HTML extra',
    'viewplayer-current_mute' => 'Current Mute',
    'viewplayer-current_mute-html' => 'Current Mute HTML extra',
    'viewplayer-previous_bans' => 'Previous Bans',
    'viewplayer-previous_mutes' => 'Previous Mutes',
    'viewplayer-warnings' => 'Warnings',
    'viewplayer-kicks' => 'Kicks',
    'viewplayer-button-save' => 'Save',
    'misc-header' => 'Miscellaneous',
    'misc-clear_cache' => 'Clear Cache',
  ),
  'firstrun' => array(
    /* 'firstrun' translation is yet not in use */
    'welcome' => 'Welcome!',
    'thankyou' => 'Thanks for using the BanManager-WebUI.',
    'failed' => 'Oh no, the check failed!',
    'failed-extended' => 'Check if you have set up everything correctly and try again.',
    'pending-setup' => 'It seems like you did not yet setup the WebUI. Let\'s get started with that right now.',
    'preparation' => 'Preperation / checklist',
    'task-cache' => 'Make sure the <kbd>cache</kbd> directory is writeable and readable.',
    'task-rename_settings' => 'Rename the <kbd>settingsRename.php</kbd> file to <kbd>settings.php</kbd>.',
    'task-writable_settings' => 'Make sure the <kbd>settings.php</kbd> file is writeable and readable.',
    'task-proper_passwort' => 'Open your <kbd>settings.php</kbd> with an editor (such as Notepad++) and adjust the settings. Make sure to set a strong password!',
    'button-submit' => 'Run check',
    'button-back' => 'Back to WebUI',
  ),
);

/**
* These are the settings for editing the layout of Ban Management
**/

$theme['navbar-dark'] = false; // Enable dark theme for the navbar

?>
