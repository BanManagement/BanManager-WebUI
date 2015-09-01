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
	$associatedAccounts = cache("SELECT HEX(id) AS id, name FROM ".$server['playersTable']." WHERE ip = INET_ATON('".$_GET['ip']."')", $settings['cache_viewip'], $_GET['server'].'/ips', $server, '', true);
	$currentBans = cache("SELECT *, a.name AS actor_name FROM ".$server['ipBansTable']." b JOIN ".$server['playersTable']." a ON b.actor_id = a.id WHERE b.ip = INET_ATON('".$_GET['ip']."')", $settings['cache_viewip'], $_GET['server'].'/ips', $server);
	$pastBans = cache("SELECT *, a.name AS actor_name, pa.name AS pastActor_name, pastCreated FROM ".$server['ipBanRecordsTable']." b JOIN ".$server['playersTable']." a ON b.actor_id = a.id JOIN ".$server['playersTable']." pa ON b.pastActor_id = pa.id WHERE b.ip = INET_ATON('".$_GET['ip']."')", $settings['cache_viewip'], $_GET['server'].'/ips', $server);
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

		if ($admin || !$settings['associated_accounts_only_for_admins']) {

		?>
			<br />
			<table class="table table-striped table-bordered" id="associated-accounts">
				<caption>Associated Accounts</caption>
				<thead>
					<tr>
						<th>ID</th>
						<th>Playername</th>
						<th>UUID</th>
						<th>IP</th>
					</tr>
				</thead>
				<tbody>
					<?php
						if(count($associatedAccounts) == 0) {
							echo '
				<tr>
					<td colspan="4">None found</td>
				</tr>';
						} else {
							if (count($associatedAccounts) == 2){
								echo '
									<tr>
										<td>'.($i + 1).'</td>
										<td>'.$associatedAccounts['name'].'</td>
										<td>'.$associatedAccounts['id'].'</td>
										<td>'.$_GET['ip'].'</td>
									</tr>';
							} else {
								foreach($associatedAccounts as $i => $r) {
									echo '
										<tr>
											<td>'.($i + 1).'</td>
											<td>'.$r['name'].'</td>
											<td>'.$r['id'].'</td>
											<td>'.$_GET['ip'].'</td>
										</tr>';
								}
							}
						}
					?>
				</tbody>
			</table>
			<?php } ?>
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
				echo '<button disabled class="btn btn-danger btn-xs bantype">Never</button>';
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
						<td>'.$currentBans['actor_name'].'</td>
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
							<a class="btn btn-danger delete" title="Unban" data-role="confirm" href="#" data-confirm-title="Unban '.$_GET['ip'].'" data-confirm-body="Are you sure you want to unban '.$_GET['ip'].'?<br />This cannot be undone"><i class="icon-trash icon-white"></i> Unban</a>
						</td>
					</tr>
				</tfoot>';
		}
				?>
			</table>
		<?php
		if($admin && count($currentBans) != 0) {?>
			<div class="modal fade" id="editipban">
				<div class="modal-dialog">
					<div class="modal-content">
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
											<textarea id="banreason" name="reason" class="form-control" rows="4"><?php echo $currentBans['reason']; ?></textarea>
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
							<input type="hidden" name="expiresTimestamp" value="<?php echo $currentBans['expires']; ?>" />
						</form>
					</div>
				</div>
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
						<th>At</th>
						<th><span class="glyphicon glyphicon-pencil"></span></th><?php
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
						<td colspan="9">None</td>
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
						<td>'.$r['pastActor_name'].'</td>
						<td>'.date('H:i:s d/m/y', $r['pastCreated']).'</td>
						<td>'.($r['expired'] == 0 ? 'Never' : secs_to_h($r['expired'] - $r['pastCreated'])).'</td>
						<td>'.$r['actor_name'].'</td>
						<td>'.date('H:i:s d/m/y', $r['created']).'</td>'.($serverName ? '
						<td>'.$r['server'].'</td>' : '').($admin ? '
						<td class="admin-options"><a href="#" class="btn btn-danger btn-xs delete" title="Remove" data-server="'.$_GET['server'].'" data-record-id="'.$r['id'].'"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a></td>' : '').'
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
