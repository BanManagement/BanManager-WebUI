<?php

/*  BanManagement © 2012, a web interface for the Bukkit plugin BanManager
		by James Mortemore of http://www.frostcast.net
	is licenced under a Creative Commons
	Attribution-NonCommercial-ShareAlike 2.0 UK: England & Wales.
	Permissions beyond the scope of this licence
	may be available at http://creativecommons.org/licenses/by-nc-sa/2.0/uk/.
	Additional licence terms at https://raw.github.com/confuser/Ban-Management/master/banmanagement/licence.txt
*/
if(!isset($_GET['server']) || !is_numeric($_GET['server']))
	redirect('index.php');
else if(!isset($settings['servers'][$_GET['server']]))
	redirect('index.php');
else if(!isset($_GET['ip']) || empty($_GET['ip']))
	redirect('index.php');
else if(!filter_var($_GET['ip'], FILTER_VALIDATE_IP))
	redirect('index.php');
else {
	// Get the server details
	$server = $settings['servers'][$_GET['server']];

	// Clear old ip
	clearCache($_GET['server'].'/ips', 300);
	clearCache($_GET['server'].'/mysqlTime', 300);

	// Check if they are logged in as an admin
	if(isset($_SESSION['admin']) && $_SESSION['admin'])
		$admin = true;
	else
		$admin = false;

	// Check if the player exists
	$currentBans = cache("SELECT *, HEX(actor_id) AS actor_id FROM ".$server['ipBansTable']." WHERE ip = INET_ATON('".$_GET['ip']."')", $settings['cache_viewip'], $_GET['server'].'/ips', $server);
	$pastBans = cache("SELECT *, HEX(actor_id) AS actor_id, HEX(pastActor_id) AS pastActor_id FROM ".$server['ipBanRecordsTable']." WHERE ip = INET_ATON('".$_GET['ip']."')", $settings['cache_viewip'], $_GET['server'].'/ips', $server);
	if(count($currentBans) == 0 && count($pastBans) == 0) {
		errors('IP does not exist');
		?><a href="index.php" class="btn btn-primary">New Search</a><?php
	} else {
		// They have been banned, naughty!
		// Now check the time differences!
		$timeDiff = cache('SELECT ('.time().' - UNIX_TIMESTAMP(now()))/3600 AS mysqlTime', 5, $_GET['server'].'/mysqlTime', $server); // Cache it for a few seconds

		$mysqlTime = $timeDiff['mysqlTime'];
		$mysqlTime = ($mysqlTime > 0)  ? floor($mysqlTime) : ceil ($mysqlTime);
		$mysqlSecs = ($mysqlTime * 60) * 60;
		?>
		<div class="hero-unit">
			<h2><?php echo $_GET['ip']; ?></h2>
			<h3>Server: <?php echo $server['name']; ?></h3>
		<?php
		$id = array_keys($settings['servers']);
		$i = 0;
		$html = '';
		if(count($settings['servers']) > 1) {
			echo '
			<h5>Change Server: ';
			foreach($settings['servers'] as $serv) {
				if($serv['name'] != $server['name']) {
					$html .= '<a href="index.php?action=viewplayer&ip='.$_GET['ip'].'&server='.$id[$i].'">'.$serv['name'].'</a>, ';
				}
				++$i;
			}
			echo substr($html, 0, -2).'
			</h5>';
		}
			?>
			<br />
			<table class="table table-striped table-bordered">
				<caption>Current Ban</caption>
				<tbody>
				<?php
		if(count($currentBans) == 0) {
			echo '
					<tr>
						<td colspan="2">None</td>
					</tr>';
		} else {
			$reason = str_replace(array('&quot;', '"'), array('&#039;', '\''), $currentBans['reason']);
			echo '
					<tr>
						<td>Expires in:</td>
						<td>';
			if($currentBans['expires'] == 0)
				echo '<span class="label label-important">Never</span>';
			else {
				$currentBans['expires'] = $currentBans['expires'] + $mysqlSecs;
				$currentBans['created'] = $currentBans['created'] + $mysqlSecs;
				$expires = $currentBans['expires'] - time();
				if($expires > 0)
					echo '<time datetime="'.date('c', $currentBans['expires']).'">'.secs_to_h($expires).'</time>';
				else
					echo 'Now';
			}
			echo '</td>
					</tr>
					<tr>
						<td>Banned by:</td>
						<td>'.UUIDtoPlayerName($currentBans['actor_id'], $server).'</td>
					</tr>
					<tr>
						<td>Banned at:</td>
						<td>'.date('jS F Y h:i:s A', $currentBans['created']).'</td>
					</tr>
					<tr>
						<td>Reason:</td>
						<td>'.$reason.'</td>
					</tr>';
			if(!empty($currentBans['server'])) {
				echo '
					<tr>
						<td>Server:</td>
						<td>'.$currentBans['server'].'</td>
					</tr>';
			}
		}
				?>
				</tbody>
		<?php
		if($admin && count($currentBans) != 0) {
			echo '
				<tfoot>
					<tr>
						<td colspan="2">
							<a class="btn btn-warning edit" title="Edit" href="#editipban" data-toggle="modal"><i class="icon-pencil icon-white"></i> Edit</a>
							<a class="btn btn-danger delete" title="Unban" data-role="confirm" href="index.php?action=deleteipban&ajax=true&authid='.sha1($settings['password']).'&server='.$_GET['server'].'&id='.$currentBans['id'].'" data-confirm-title="Unban '.$_GET['ip'].'" data-confirm-body="Are you sure you want to unban '.$_GET['ip'].'?<br />This cannot be undone"><i class="icon-trash icon-white"></i> Unban</a>
						</td>
					</tr>
				</tfoot>';
		}
				?>
			</table>
		<?php
		if($admin && count($currentBans) != 0) {?>
			<div class="modal hide fade" id="editipban">
				<form class="form-horizontal" action="" method="post">
					<div class="modal-header">
						<button type="button" class="close" data-dismiss="modal">&times;</button>
						<h3>Edit IP Ban</h3>
					</div>
					<div class="modal-body">
						<fieldset>
							<div class="control-group">
								<label class="control-label" for="yourtime">Your Time:</label>
								<div class="controls">
									<span class="yourtime"></span>
								</div>
							</div>
							<div class="control-group">
								<label class="control-label" for="servertime">Server Time:</label>
								<div class="controls">
									<span class="servertime"><?php echo date('d/m/Y H:i:s', time() + $mysqlSecs); ?></span>
								</div>
							</div>
							<div class="control-group">
								<label class="control-label" for="bandatetime">Expires Server Time:</label>
								<div class="controls">
									<div class="input-append datetimepicker date"><?php
			echo '
										<div class="input-prepend">
											<button class="btn btn-danger bantype" type="button">';
			if($currentBans['expires'] == 0)
				echo 'Never';
			else
				echo 'Temp';

			echo '</button>
											<input type="text" class="required';

			if($currentBans['expires'] == 0)
				echo ' disabled" disabled="disabled"';
			else
				echo '"';

			echo ' name="expires" data-format="dd/MM/yyyy hh:mm:ss" value="';

			if($currentBans['expires'] == 0)
				echo '';
			else
				echo date('d/m/Y H:i:s', $currentBans['expires']);

			echo '" id="bandatetime" />';
										?>
											<span class="add-on">
												<i data-time-icon="icon-time" data-date-icon="icon-calendar"></i>
											</span>
										</div>
									</div>
								</div>
							</div>
							<div class="control-group">
								<label class="control-label" for="banreason">Reason:</label>
								<div class="controls">
									<textarea id="banreason" name="reason" rows="4"><?php echo $currentBans['reason']; ?></textarea>
								</div>
							</div>
						</fieldset>
					</div>
					<div class="modal-footer">
						<a href="#" class="btn" data-dismiss="modal">Close</a>
						<input type="submit" class="btn btn-primary" value="Save" />
					</div>
					<input type="hidden" name="id" value="<?php echo $currentBans['id']; ?>" />
					<input type="hidden" name="server" value="<?php echo $_GET['server']; ?>" />
					<input type="hidden" name="expiresTimestamp" value="" />
				</form>
			</div><?php
		}
			?>
			<br />
			<table class="table table-striped table-bordered" id="previous-ip-bans">
				<caption>Previous Bans</caption>
				<thead>
					<tr>
						<th>ID</th>
						<th>Reason</th>
						<th>By</th>
						<th>On</th>
						<th>Length</th>
						<th>Unbanned By</th>
						<th>At</th><?php
		if(!isset($pastBans[0]) || (isset($pastBans[0]) && !is_array($pastBans[0])))
			$pastBans = array($pastBans);
		$serverName = false;
		foreach($pastBans as $r) {
			if(!empty($r['server'])) {
				$serverName = true;
				break;
			}
		}
		if($serverName) {
				echo '
					<th>Server</th>';
		}
				?>

					</tr>
				</thead>
				<tbody><?php
		if(isset($pastBans[0]) && count($pastBans[0]) == 0) {
			echo '
					<tr>
						<td colspan="8">None</td>
					</tr>';
		} else {
			$i = 1;
			if(!isset($pastBans[0]) || (isset($pastBans[0]) && !is_array($pastBans[0])))
				$pastBans = array($pastBans);
			foreach($pastBans as $r) {
				$r['reason'] = str_replace(array('&quot;', '"'), array('&#039;', '\''), $r['reason']);
				$r['expired'] = ($r['expired'] != 0 ? $r['expired'] + $mysqlSecs : $r['expired']);
				$r['pastCreated'] = $r['pastCreated'] + $mysqlSecs;
				$r['created'] = $r['created'] + $mysqlSecs;

				echo '
					<tr>
						<td>'.$i.'</td>
						<td>'.$r['reason'].'</td>
						<td>'.UUIDtoPlayerName($r['pastActor_id'], $server).'</td>
						<td>'.date('H:i:s d/m/y', $r['pastCreated']).'</td>
						<td>'.($r['expired'] == 0 ? 'Never' : secs_to_h($r['expired'] - $r['pastCreated'])).'</td>
						<td>'.UUIDtoPlayerName($r['actor_id'], $server).'</td>
						<td>'.date('H:i:s d/m/y', $r['created']).'</td>'.($serverName ? '
						<td>'.$r['server'].'</td>' : '').($admin ? '
						<td class="admin-options"><a href="#" class="btn btn-danger delete" title="Remove" data-server="'.$_GET['server'].'" data-record-id="'.$r['id'].'"><i class="icon-trash icon-white"></i></a></td>' : '').'
					</tr>';
				++$i;
			}
		}
				?>

				</tbody>
			</table>
		</div>
		<?php
	}
}
?>
