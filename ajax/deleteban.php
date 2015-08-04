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

if(!isset($_SESSION['admin']) || (isset($_SESSION['admin']) && !$_SESSION['admin']))
	die('Hacking attempt');
else if(!isset($_GET['authid']) || (isset($_GET['authid']) && $_GET['authid'] != sha1($settings['password'])))
	die('Hacking attempt');
else if(!isset($_GET['server']) || !is_numeric($_GET['server']))
	die('Hacking attempt');
else if(!isset($settings['servers'][$_GET['server']]))
	die('Hacking attempt');
else if(!isset($_GET['id']) || !is_numeric($_GET['id']))
	die('Hacking attempt');
else {
	// Get the server details
	$server = $settings['servers'][$_GET['server']];

	$mysqlicon = connect($server);

	if(!$mysqlicon)
		$error = 'Unable to connect to database';
	else {
		$currentBan = mysqli_query($mysqlicon, "SELECT id FROM ".$server['playerBansTable']." WHERE id = '".$_GET['id']."'");

		if(mysqli_num_rows($currentBan) == 0)
			$error = 'That record does not exist';
		else {

			mysqli_query($mysqlicon, "INSERT INTO ".$server['playerBanRecordsTable']." (player_id, reason, expired, actor_id, pastActor_id, pastCreated, created) SELECT b.player_id, b.reason, b.expires, 0, b.actor_id, b.created, UNIX_TIMESTAMP(now()) FROM ".$server['playerBansTable']." AS b WHERE b.id = '".$_GET['id']."'");
			// Now delete it
			mysqli_query($mysqlicon, "DELETE FROM ".$server['playerBansTable']." WHERE id = '".$_GET['id']."'");

			// Clear the cache
			clearCache($_GET['server'].'/players');

			$array['success'] = 'true';
		}
	}
}

mysqli_close($mysqlicon);

if(isset($error))
	$array['error'] = $error;
echo json_encode($array);
?>
