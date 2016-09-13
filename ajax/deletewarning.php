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
		$pastBans = mysqli_query($mysqlicon, "SELECT id FROM ".$server['playerWarningsTable']." WHERE id = '".$_GET['id']."'");

		if(mysqli_num_rows($pastBans) == 0)
			$error = 'That record does not exist';
		else {
			mysqli_query($mysqlicon, "DELETE FROM ".$server['playerWarningsTable']." WHERE id = '".$_GET['id']."'");

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
