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

	if(empty($_POST['reason']))
		$_POST['reason'] = '(WebUI)';

	if(isset($_POST['silent']))
		$silent = 1;
	else
		$silent = 0;

	if(!isset($error)) {
		// Get the server details
		$server = $settings['servers'][$_POST['server']];

		$mysqlicon = connect($server);

		if(!$mysqlicon)
			$error = 'Unable to connect to database';
		else {
			$currentBan = mysqli_query($mysqlicon, "SELECT id FROM ".$server['playerBansTable']." WHERE id = '".$_POST['id']."'");

			if(mysqli_num_rows($currentBan) == 0)
				$error = 'That ban does not exist';
			else {
				mysqli_query($mysqlicon, "UPDATE ".$server['playerBansTable']." SET reason = '".$_POST['reason']."', updated = UNIX_TIMESTAMP(now()), expires = '$timestamp', silent = '$silent' WHERE id = '".$_POST['id']."'");

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
