<?php

if(!isset($_SESSION['admin']) || (isset($_SESSION['admin']) && !$_SESSION['admin']))
	die('Hacking attempt');
else if(!isset($_GET['authid']) || (isset($_GET['authid']) && $_GET['authid'] != sha1($settings['password'])))
	die('Hacking attempt');
else if(!isset($_POST['server']) || !is_numeric($_POST['server']))
	die('Hacking attempt');
else if(!isset($settings['servers'][$_POST['server']]))
	die('Hacking attempt');
else if(!isset($_POST['uuid']))
	die('Hacking attempt');
else {

	// Validate the timestamp
	if(isset($_POST['expires'])) {
		if(!is_numeric($_POST['expiresTimestamp']))
			$error = 'Invalid timestamp data';
		else
			$timestamp = $_POST['expiresTimestamp'];
	}
	else
		$timestamp = 0;
	// Set the reason
	if(!empty($_POST['reason']))
		$reason = $_POST['reason'].' (WebUI)';
	else
		$reason = '(WebUI)';

	if(isset($_POST['soft']))
		$soft = 1;
	else
		$soft = 0;

	if(isset($_POST['silent']))
		$silent = 1;
	else
		$silent = 0;

	if(!isset($error)) {
		// Get the server details
		$server = $settings['servers'][$_POST['server']];
		$consoleId = str_replace('-', '', $server['consoleId']);

		$mysqlicon = connect($server);

		if(!$mysqlicon)
			$error = 'Unable to connect to database';
		else {
			switch ($settings['punish']) {
				// Overwrite
				case 1:
				if (isset($_POST['id']) && is_numeric($_POST['id'])) {

					$currentBan = mysqli_query($mysqlicon, "SELECT id FROM ".$server['playerMutesTable']." WHERE id = '".$_POST['id']."'");

					if(mysqli_num_rows($currentBan) != 0)

						// Update old
						mysqli_query($mysqlicon, "UPDATE ".$server['playerMutesTable']." SET actor_id = UNHEX('$consoleId'), reason = '$reason', updated = UNIX_TIMESTAMP(now()), expires = '$timestamp', soft = '$soft', silent = '$silent' WHERE id = '".$_POST['id']."'");
				}
				else
					// Or create new
					mysqli_query($mysqlicon, "INSERT INTO ".$server['playerMutesTable']." (player_id, actor_id, reason, created, updated, expires, soft, silent) VALUES (UNHEX('".$_POST['uuid']."'), UNHEX('$consoleId'), '$reason', UNIX_TIMESTAMP(now()), UNIX_TIMESTAMP(now()), '$timestamp', '$soft', '$silent')");
				break;

				// Delete
				case 2:
				if (isset($_POST['id']) && is_numeric($_POST['id'])) {

					$currentBan = mysqli_query($mysqlicon, "SELECT id FROM ".$server['playerMutesTable']." WHERE id = '".$_POST['id']."'");

					if(mysqli_num_rows($currentBan) != 0) {

						// Create record
						mysqli_query($mysqlicon, "INSERT INTO ".$server['playerMuteRecordsTable']." (player_id, reason, expired, actor_id, pastActor_id, pastCreated, created, createdReason, silent) SELECT b.player_id, b.reason, b.expires, UNHEX('$consoleId'), b.actor_id, b.created, UNIX_TIMESTAMP(now()), 'WebUI', b.silent FROM ".$server['playerMutesTable']." AS b WHERE b.id = '".$_POST['id']."'");
						// Delete it
						mysqli_query($mysqlicon, "DELETE FROM ".$server['playerMutesTable']." WHERE id = '".$_POST['id']."'");
						// Now punish
						mysqli_query($mysqlicon, "INSERT INTO ".$server['playerMutesTable']." (player_id, actor_id, reason, created, updated, expires, soft, silent) VALUES (UNHEX('".$_POST['uuid']."'), UNHEX('$consoleId'), '$reason', UNIX_TIMESTAMP(now()), UNIX_TIMESTAMP(now()), '$timestamp', '$soft', '$silent')");
					}
				}
				else
					// Or punish
					mysqli_query($mysqlicon, "INSERT INTO ".$server['playerMutesTable']." (player_id, actor_id, reason, created, updated, expires, soft, silent) VALUES (UNHEX('".$_POST['uuid']."'), UNHEX('$consoleId'), '$reason', UNIX_TIMESTAMP(now()), UNIX_TIMESTAMP(now()), '$timestamp', '$soft', '$silent')");
				break;

				// Stop
				case 3:
				if (isset($_POST['id']) && is_numeric($_POST['id'])) {

					$currentBan = mysqli_query($mysqlicon, "SELECT id FROM ".$server['playerMutesTable']." WHERE id = '".$_POST['id']."'");

					if(mysqli_num_rows($currentBan) != 0)

						// Throw error
						$error = 'There is already an active punishment of this type. Wait for it to expire or remove it before trying to add a new one!';
					else
						// Or punish
						mysqli_query($mysqlicon, "INSERT INTO ".$server['playerMutesTable']." (player_id, actor_id, reason, created, updated, expires, soft, silent) VALUES (UNHEX('".$_POST['uuid']."'), UNHEX('$consoleId'), '$reason', UNIX_TIMESTAMP(now()), UNIX_TIMESTAMP(now()), '$timestamp', '$soft', '$silent')");
				}
				break;

				default:
				$error = 'Something went wrong. Check the value of $settings[\'punish\'] in settings.php';
				break;
			}

			// Clear the cache
			clearCache($_POST['server'].'/players');

			$array['success'] = 'true';
		}
	}
}
mysqli_close($mysqlicon);

if(isset($error))
	$array['error'] = $error;
echo json_encode($array);
?>