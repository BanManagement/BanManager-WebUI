<?php

if(!isset($_SESSION['admin']) || (isset($_SESSION['admin']) && !$_SESSION['admin']))
	die('Hacking attempt');
else if(!isset($_GET['authid']) || (isset($_GET['authid']) && $_GET['authid'] != sha1($settings['password'])))
	die('Hacking attempt');
else if(!isset($_POST['server']) || !is_numeric($_POST['server']))
	die('Hacking attempt');
else if(!isset($settings['servers'][$_POST['server']]))
	die('Hacking attempt');
else if(!isset($_POST['id']) || !is_numeric($_POST['id']))
	die('Hacking attempt');
else {

	// Validate the timestamp
	if(isset($_POST['expires'])) {
		if(!is_numeric($_POST['expiresTimestamp']))
			$error = 'Invalid timestamp data';
		else
			$timestamp = $_POST['expiresTimestamp'];
	} else
		$timestamp = 0;

	if(!isset($_POST['reason']))
		$_POST['reason'] = '';

	if(!isset($error)) {
		// Get the server details
		$server = $settings['servers'][$_POST['server']];

		$mysqlicon = connect($server);

		if(!$mysqlicon)
			$error = 'Unable to connect to database';
		else {
			$currentMute = mysqli_query($mysqlicon, "SELECT id FROM ".$server['playerMutesTable']." WHERE id = '".$_POST['id']."'");

			if(mysqli_num_rows($currentMute) == 0)
				$error = 'That mute does not exist';
			else {
				mysqli_query($mysqlicon, "UPDATE ".$server['playerMutesTable']." SET reason = '".$_POST['reason']."', updated = UNIX_TIMESTAMP(now()),  expires = '$timestamp' WHERE id = '".$_POST['id']."'");

				// Clear the cache
				clearCache($_POST['server'].'/players');

				$array['success'] = 'true';
			}
		}
	}
}

mysqli_close($mysqlicon);

if(isset($error))
	$array['error'] = $error;
echo json_encode($array);
?>
