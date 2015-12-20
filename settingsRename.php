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

$settings['language'] = "en"; // Default locale setting ("en" by default)

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
$settings['cache_playertouuid'] = 600;

// Skin service options
// ("%name%" is the placeholder for the player %name)
// ("%uuid%" is the placeholder for the player uuid)
$settings['skin']['helm'] = "https://crafatar.com/avatars/%uuid%?overlay&size=24";
$settings['skin']['complete'] = "https://crafatar.com/renders/body/%uuid%?overlay&scale=7";

/**
* These are the settings for editing the layout of Ban Management
**/

$theme['navbar-dark'] = false; // Enable dark theme for the navbar


// For possible external links in nav bar, uncomment the following lines

// $theme['external_links'] = array(
//   'Test' => 'http://test.de',
//   'Toast' => 'http://toast.de',
// );

?>
