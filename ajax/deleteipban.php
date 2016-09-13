<?php

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
		$currentBan = mysqli_query($mysqlicon, "SELECT id FROM ".$server['ipBansTable']." WHERE id = '".$_GET['id']."'");

		if(mysqli_num_rows($currentBan) == 0) {
			$error = 'That record does not exist';
		} else if (!$server['consoleId']) {
			$error = 'Please specify a consoleId for this server';
		} else {
			$consoleId = str_replace('-', '', $server['consoleId']);

			mysqli_query($mysqlicon, "INSERT INTO ".$server['ipBanRecordsTable']." (ip, reason, expired, actor_id, pastActor_id, pastCreated, created) SELECT b.ip, b.reason, b.expires, UNHEX('$consoleId'), b.actor_id, b.created, UNIX_TIMESTAMP(now()) FROM ".$server['ipBansTable']." AS b WHERE b.id = '".$_GET['id']."'");
			// Now delete it
			mysqli_query($mysqlicon, "DELETE FROM ".$server['ipBansTable']." WHERE id = '".$_GET['id']."'");

			// Clear the cache
			clearCache($_GET['server'].'/ips');

			$array['success'] = 'true';
		}
	}
}

mysqli_close($mysqlicon);

if(isset($error))
	$array['error'] = $error;
echo json_encode($array);
?>
