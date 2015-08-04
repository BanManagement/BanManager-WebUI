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

// Disable errors to prevent invalid JSON
error_reporting(0);
@ini_set('display_errors', 0); // Fallback incase error_reporting(0) fails

if(!isset($_SESSION['admin']) || (isset($_SESSION['admin']) && !$_SESSION['admin']))
	die('Invalid: action missing.');
else if(!isset($_GET['authid']) || (isset($_GET['authid']) && $_GET['authid'] != sha1($settings['password'])))
	die('Invalid: authentication failed.');
else if(!is_alphanumdash($_POST['playerstable']))
	die('Invalid: input "playerstable" is not alpha nummerical (dashes allowed)');
else if(!is_alphanumdash($_POST['playerbanstable']))
	die('Invalid: input "playerbanstable" is not alpha nummerical (dashes allowed)');
else if(!is_alphanumdash($_POST['playerbanrecordstable']))
	die('Invalid: input "playerbanrecordstable" is not alpha nummerical (dashes allowed)');
else if(!is_alphanumdash($_POST['playermutestable']))
	die('Invalid: input "playermutestable" is not alpha nummerical (dashes allowed)');
else if(!is_alphanumdash($_POST['playermutesrecordstable']))
	die('Invalid: input "playermutesrecordstable" is not alpha nummerical (dashes allowed)');
else if(!is_alphanumdash($_POST['playerkickstable']))
	die('Invalid: input "playerkickstable" is not alpha nummerical (dashes allowed)');
else if(!is_alphanumdash($_POST['playerwarningstable']))
	die('Invalid: input "playerwarningstable" is not alpha nummerical (dashes allowed)');
else if(!is_alphanumdash($_POST['ipbanstable']))
	die('Invalid: input "ipbanstable" is not alpha nummerical (dashes allowed)');
else if(!is_alphanumdash($_POST['ipbanrecordstable']))
	die('Invalid: input "ipbanrecordstable" is not alpha nummerical (dashes allowed)');

function tableExists($name) {
	global $mysqli;

	if(!@mysqli_query($mysqli, "SELECT * FROM $name")){
		return false;
	}

	return true;
}

$mysqli = mysqli_connect($_POST['host'], $_POST['username'], $_POST['password'], $_POST['database'])
	or die('Unable to connect, check connection information is correct');

// Test the mysql connection
if(!tableExists($_POST['playerstable']))
	$error = 'Players table not found';
else if(!tableExists($_POST['playerbanstable']))
	$error = 'Player Bans table not found';
else if(!tableExists($_POST['playerbanrecordstable']))
	$error = 'Player Ban Records record table not found';
else if(!tableExists($_POST['playermutestable']))
	$error = 'Player Mutes table not found';
else if(!tableExists($_POST['playermuterecordstable']))
	$error = 'Player Mutes Records table not found';
else if(!tableExists($_POST['playerkickstable']))
	$error = 'Player Kicks table not found';
else if(!tableExists($_POST['playerwarningstable']))
	$error = 'Player Warnings table not found';
else if(!tableExists($_POST['ipbanstable']))
	$error = 'IP Bans table not found';
else if(!tableExists($_POST['ipbanrecordstable']))
	$error = 'IP Ban Records table not found';
else {
	// Success! Add it
	$servers = $settings['servers'];

	if (empty($servers))
		$servers = array();

	$servers[] = array(
		'name' => $_POST['servername'],
		'host' => $_POST['host'],
		'database' => $_POST['database'],
		'username' => $_POST['username'],
		'password' => $_POST['password'],
		'playersTable' => $_POST['playerstable'],
		'playerBansTable' => $_POST['playerbanstable'],
		'playerBanRecordsTable' => $_POST['playerbanrecordstable'],
		'playerMutesTable' => $_POST['playermutestable'],
		'playerMuteRecordsTable' => $_POST['playermuterecordstable'],
		'playerKicksTable' => $_POST['playerkickstable'],
		'playerWarningsTable' => $_POST['playerwarningstable'],
		'ipBansTable' => $_POST['ipbanstable'],
		'ipBanRecordsTable' => $_POST['ipbanrecordstable']
	);

	$settings['servers'] = $servers;
	$servers = serialize($servers);
	$servers = "['servers'] = '".$servers;
	$contents = file_get_contents('settings.php');
	$contents = preg_replace("/\['servers'\] = '(.*?)/", $servers, $contents);
	file_put_contents('settings.php', $contents);
	$array['success'] = 'true';
}
if(isset($error))
	$array['error'] = $error;
else {
	$array['success'] = array('id' => count($settings['servers']) - 1, 'serverName' => $_POST['servername']);
}
echo json_encode($array);
?>
