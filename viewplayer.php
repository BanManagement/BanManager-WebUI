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
else if(!isset($_GET['player']) || empty($_GET['player']))
	redirect('index.php');
else if(isset($_GET['player']) && preg_match('/[^a-z0-9_]{2,16}/i', $_GET['player']))
	redirect('index.php');
else {
	// Get the server details
	$server = $settings['servers'][$_GET['server']];

	// Clear old players
	clearCache($_GET['server'].'/players', 300);
	clearCache($_GET['server'].'/mysqlTime', 300);

	// Check if they are logged in as an admin
	if(isset($_SESSION['admin']) && $_SESSION['admin']){
		$admin = true;
	}	else {
		$admin = false;
	}

	$UUID = playerNameToUUID($_GET['player'], $server);
	$UUID = $UUID[0];

	// Check if the player exists
	$currentBans = cache("SELECT *, HEX(player_id) as player_id, HEX(actor_id) as actor_id FROM ".$server['playerBansTable']." WHERE player_id = UNHEX('".$UUID."')", $settings['cache_viewplayer'], $_GET['server'].'/players', $server);
	$pastBans = cache("SELECT *, HEX(player_id) as player_id, HEX(actor_id) as actor_id, HEX(pastActor_id) as pastActor_id FROM ".$server['playerBanRecordsTable']." WHERE player_id = UNHEX('".$UUID."') AND pastCreated <> 0", $settings['cache_viewplayer'], $_GET['server'].'/players', $server);
	$currentMutes = cache("SELECT *, HEX(player_id) as player_id, HEX(actor_id) as actor_id FROM ".$server['playerMutesTable']." WHERE player_id = UNHEX('".$UUID."')", $settings['cache_viewplayer'], $_GET['server'].'/players', $server);
	$pastMutes = cache("SELECT *, HEX(player_id) as player_id, HEX(actor_id) as actor_id, HEX(pastActor_id) as pastActor_id FROM ".$server['playerMuteRecordsTable']." WHERE player_id = UNHEX('".$UUID."')", $settings['cache_viewplayer'], $_GET['server'].'/players', $server);
	$pastKicks = cache("SELECT *, HEX(player_id) as player_id, HEX(actor_id) as actor_id FROM ".$server['playerKicksTable']." WHERE player_id = UNHEX('".$UUID."')", $settings['cache_viewplayer'], $_GET['server'].'/players', $server);
	$pastWarnings = cache("SELECT *, HEX(player_id) as player_id, HEX(actor_id) as actor_id FROM ".$server['playerWarningsTable']." WHERE player_id = UNHEX('".$UUID."')", $settings['cache_viewplayer'], $_GET['server'].'/players', $server);

	if(count($currentBans) == 0 && count($pastBans) == 0 && count($currentMutes) == 0 && count($pastMutes) == 0 && count($pastKicks) == 0 && $pastWarnings == 0) {
		errors('Player does not exist');
		?><a href="index.php" class="btn btn-primary">New Search</a><?php
	} else {
		// They have been banned, naughty!
		// Now check the time differences!
		$timeDiff = cache('SELECT ('.time().' - UNIX_TIMESTAMP(now()))/3600 AS mysqlTime', 5, $_GET['server'].'/mysqlTime', $server); // Cache it for a few seconds

		$mysqlTime = $timeDiff['mysqlTime'];
		$mysqlTime = ($mysqlTime > 0)  ? floor($mysqlTime) : ceil ($mysqlTime);
		$mysqlSecs = ($mysqlTime * 60) * 60;
		?>
		<div class="row">
			<div class="col-lg-3">
					<div class="player_information">
							<center> <img src="https://cravatar.eu/3d/<?php echo $_GET['player'];?>/256" alt="<?php echo $_GET['player'];?>" class="fullplayer"> </center>
							<span id="player_name" title="UUID: <?php echo $UUID;?>"><?php echo $_GET['player'];?></span>
					</div>
			</div>
			<div class="col-lg-9" id="player_ban_info">
					<h4>Current Server: <?php echo $server['name']; ?></h4>
		<?php
		$id = array_keys($settings['servers']);
		$i = 0;
		$html = '';
		if(count($settings['servers']) > 1) {
			echo '
			<p>Change Server: ';
			foreach($settings['servers'] as $serv) {
				if($serv['name'] != $server['name']) {
					$html .= '<a href="index.php?action=viewplayer&player='.$_GET['player'].'&server='.$id[$i].'">'.$serv['name'].'</a>, ';
				}
				++$i;
			}
			echo substr($html, 0, -2).'
			</p>';
		}

		if((isset($settings['player_current_ban']) && $settings['player_current_ban']) || !isset($settings['player_current_ban'])) {
			?>
			<br />
			<table id="current-ban" class="table table-striped table-bordered">
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
						<td class="expires">';
				if($currentBans['expires'] == 0)
					echo '<span class="label label-danger">Permanent</span>';
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
						<td class="reason">'.$currentBans['reason'].'</td>
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
				</tbody><?php
			if($admin && count($currentBans) != 0) {
				echo '
				<tfoot>
					<tr>
						<td colspan="2">
							<a class="btn btn-warning edit" title="Edit" href="#editban" data-toggle="modal"><span class="glyphicon glyphicon-pencil"></span> Edit</a>
							<a class="btn btn-danger delete" title="Unban" data-role="confirm" href="index.php?action=deleteban&ajax=true&authid='.sha1($settings['password']).'&server='.$_GET['server'].'&id='.$currentBans['id'].'" data-confirm-title="Unban '.$_GET['player'].'" data-confirm-body="Are you sure you want to unban '.$_GET['player'].'?<br />This cannot be undone"><span class="glyphicon glyphicon-trash"></span> Unban</a>
						</td>
					</tr>
				</tfoot>';
			}
				?>
			</table>
			<?php
			if(isset($settings['player_current_ban_extra_html'])) {
				$extra = htmlspecialchars_decode($settings['player_current_ban_extra_html'], ENT_QUOTES);
				$extra = str_replace(array('{SERVER}', '{SERVERID}', '{NAME}'), array($server['name'], $_GET['server'], $_GET['player']), $extra);

				echo '
			<div id="current-ban-extra">
				'.$extra.'
			</div>';
			}
			if($admin && count($currentBans) != 0) {?>
			<div class="modal fade" id="editban">
				<div class="modal-dialog">
					<div class="modal-content">
						<form class="form-horizontal" action="" method="post">
							<div class="modal-header">
								<button type="button" class="close" data-dismiss="modal">&times;</button>
								<h3>Editing Ban</h3>
							</div>
							<div class="modal-body">
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
										<div class="input-group date datetimepicker">
										<?php
											echo '
											<span class="input-group-btn">
												<button class="btn btn-danger bantype" type="button">';
											if($currentBans['expires'] == 0)
												echo 'Permanent';
											else
												echo 'Temporary';

											echo '</button>
											</span>
											<input type="text" class="form-control required';

											if($currentBans['expires'] == 0)
												echo ' disabled" disabled="disabled"';
											else
												echo '"';

											echo ' name="expires" data-format="DD/MM/YYYY hh:mm:ss" value="';

											if($currentBans['expires'] == 0)
												echo '';
											else
												echo date('d/m/Y H:i:s', $currentBans['expires']);

											echo '" id="bandatetime" />';
										?>
											<span class="input-group-addon">
												<i class="glyphicon glyphicon-calendar"></i>
											</span>
										</div>
									</div>
								</div>
								<label for="banreason">Reason:</label>
								<textarea id="banreason" name="reason" class="form-control" rows="4"><?php echo $currentBans['reason']; ?></textarea>
							</div>
							<div class="modal-footer">
								<a href="#" class="btn" data-dismiss="modal">Close</a>
								<input type="submit" class="btn btn-primary" value="Save" />
							</div>
							<input type="hidden" name="id" value="<?php echo $currentBans['id']; ?>" />
							<input type="hidden" name="server" value="<?php echo $_GET['server']; ?>" />
							<input type="hidden" name="expiresTimestamp" value="" />
						</form>
					</div>
				</div>
			</div>
			<?php
			}
		}

		if((isset($settings['player_current_mute']) && $settings['player_current_mute']) || !isset($settings['player_current_mute'])) {
			?>
			<br />
			<table id="current-mute" class="table table-striped table-bordered">
				<caption>Current Mute</caption>
				<tbody>
				<?php
			if(count($currentMutes) == 0) {
				echo '
					<tr>
						<td colspan="2">None</td>
					</tr>';
			} else {
				$reason = str_replace(array('&quot;', '"'), array('&#039;', '\''), $currentMutes['reason']);
				echo '
					<tr>
						<td>Expires in:</td>
						<td class="expires">';
				if($currentMutes['expires'] == 0)
					echo '<span class="label label-danger">Permanent</span>';
				else {
					$currentMutes['expires'] = $currentMutes['expires'] + $mysqlSecs;
					$currentMutes['created'] = $currentMutes['created'] + $mysqlSecs;
					$expires = $currentMutes['expires'] - time();

					if($expires > 0)
						echo '<time datetime="'.date('c', $currentMutes['expires']).'">'.secs_to_h($expires).'</time>';
					else
						echo 'Now';
				}
				echo '</td>
					</tr>
					<tr>
						<td>Muted by:</td>
						<td>'.UUIDtoPlayerName($currentMutes['actor_id'], $server).'</td>
					</tr>
					<tr>
						<td>Muted at:</td>
						<td>'.date('jS F Y h:i:s A', $currentMutes['created']).'</td>
					</tr>
					<tr>
						<td>Reason:</td>
						<td class="reason">'.$currentMutes['reason'].'</td>
					</tr>
					<tr>';
				if(!empty($currentMutes['server'])) {
					echo '
					<tr>
						<td>Server:</td>
						<td>'.$currentMutes['server'].'</td>
					</tr>';
				}
			}
				?>

				</tbody>
				<?php
			if($admin && count($currentMutes) != 0) {
				echo '
				<tfoot>
					<tr>
						<td colspan="2">
							<a class="btn btn-warning edit" title="Edit" href="#editmute" data-toggle="modal"><span class="glyphicon glyphicon-pencil"></span> Edit</a>
							<a class="btn btn-danger delete" title="Unban" data-role="confirm" href="index.php?action=deletemute&ajax=true&authid='.sha1($settings['password']).'&server='.$_GET['server'].'&id='.$currentMutes['id'].'" data-confirm-title="Unban '.$_GET['player'].'" data-confirm-body="Are you sure you want to unmute '.$_GET['player'].'?<br />This cannot be undone"><span class="glyphicon glyphicon-trash"></span> Unmute</a>
						</td>
					</tr>
				</tfoot>';
			}
				?>

			</table><?php
			if(isset($settings['player_current_mute_extra_html'])) {
				$extra = htmlspecialchars_decode($settings['player_current_mute_extra_html'], ENT_QUOTES);
				$extra = str_replace(array('{SERVER}', '{SERVERID}', '{NAME}'), array($server['name'], $_GET['server'], $_GET['player']), $extra);

				echo '
			<div id="current-mute-extra">
				'.$extra.'
			</div>';
			}
			if($admin && count($currentMutes) != 0) {?>

			<div class="modal fade" id="editmute">
				<div class="modal-dialog">
					<div class="modal-content">
						<form class="form-horizontal" action="" method="post">
							<div class="modal-header">
								<button type="button" class="close" data-dismiss="modal">&times;</button>
								<h3>Editing Mute</h3>
							</div>
							<div class="modal-body">
								<div class="container">
									<div class="form-group">
										<label class="control-label" for="yourtime">Your Time:</label>
											<span class="yourtime"></span>
									</div>
									<div class="form-group">
										<label class="control-label" for="servertime">Server Time:</label>
											<span class="servertime"><?php echo date('d/m/Y H:i:s', time() + $mysqlSecs); ?></span>
									</div>
								<!--	<div class="form-group">
										<label class="control-label" for="mutedatetime">Expires Server Time:</label>
										<div class="input-group">
											<div class="input datetimepicker date">
											<?php
								/*
												echo '
												<div class="input-group-addon">
													<button class="btn btn-danger bantype" type="button">';
											if($currentMutes['expires'] == 0)
												echo 'Permanent';
											else
												echo 'Temporary';

											echo '</button>
													<input type="text" class="required';

											if($currentMutes['expires'] == 0)
												echo ' disabled" disabled="disabled"';
											else
												echo '"';

											echo ' name="expires" data-format="dd/MM/yyyy hh:mm:ss" value="';

											if($currentMutes['expires'] == 0)
												echo '';
											else
												echo date('d/m/Y H:i:s', $currentMutes['expires']);

											echo '" id="mutedatetime" />';

								*/			?>
													<span class="input-group-addon">
														<span class="glyphicon glyphicon-calendar"></span>
													</span>
												</div>
											</div>
										</div>
									</div> -->
									<div class="form-group">
										<label class="control-label" for="mutereason">Reason:</label>
											<textarea id="mutereason" class="form-control" name="reason" rows="4"><?php echo $currentMutes['reason']; ?></textarea>
									</div>
								</div>
							</div>
							<div class="modal-footer">
								<a href="#" class="btn" data-dismiss="modal">Close</a>
								<input type="submit" class="btn btn-primary" value="Save" />
							</div>
							<input type="hidden" name="id" value="<?php echo $currentMutes['id']; ?>" />
							<input type="hidden" name="server" value="<?php echo $_GET['server']; ?>" />
							<input type="hidden" name="expiresTimestamp" value="" />
						</form>
					</div>
				</div>
			</div><?php
			}
		}

		if((isset($settings['player_previous_bans']) && $settings['player_previous_bans']) || !isset($settings['player_previous_bans'])) {
		?>
			<br />
			<table class="table table-striped table-bordered" id="previous-bans">
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
			if($admin)
				echo '
						<th></th>';
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
						<td>'.($r['expired'] == 0 ? 'Permanent' : secs_to_h($r['expired'] - $r['pastCreated'])).'</td>
						<td>'.UUIDtoPlayerName($r['actor_id'], $server).'</td>
						<td>'.date('H:i:s d/m/y', $r['created']).'</td>'.($serverName ? '
						<td>'.$r['server'].'</td>' : '').($admin ? '
						<td class="admin-options"><a href="#" class="btn btn-danger delete" title="Remove" data-server="'.$_GET['server'].'" data-record-id="'.$r['id'].'"><span class="glyphicon glyphicon-trash"></span></a></td>' : '').'
					</tr>';
					++$i;
				}
			}
				?>

				</tbody>
			</table><?php
		}

		if((isset($settings['player_previous_mutes']) && $settings['player_previous_mutes']) || !isset($settings['player_previous_mutes'])) {
		?>
			<br />
			<table class="table table-striped table-bordered" id="previous-mutes">
				<caption>Previous Mutes</caption>
				<thead>
					<tr>
						<th>ID</th>
						<th>Reason</th>
						<th>By</th>
						<th>On</th>
						<th>Length</th>
						<th>Unmuted By</th>
						<th>At</th><?php
			if(isset($pastMutes[0]) && !is_array($pastMutes[0]))
				$pastMutes = array($pastMutes);
			$serverName = false;
			foreach($pastMutes as $r) {
				if(!empty($r['server'])) {
					$serverName = true;
					break;
				}
			}
			if($serverName) {
					echo '
						<th>Server</th>';
			}
			if($admin)
				echo '
						<th></th>';
				?>

					</tr>
				</thead>
				<tbody><?php
			if(count($pastMutes) == 0) {
				echo '
					<tr>
						<td colspan="8">None</td>
					</tr>';
			} else {
				$i = 1;
				foreach($pastMutes as $r) {
					$r['reason'] = str_replace(array('&quot;', '"'), array('&#039;', '\''), $r['reason']);
					$r['expired'] = ($r['expired'] != 0 ? $r['expired'] + $mysqlSecs : $r['expired']);
					$r['created'] = $r['created'] + $mysqlSecs;
					echo '
					<tr>
						<td>'.$i.'</td>
						<td>'.$r['reason'].'</td>
						<td>'.UUIDtoPlayerName($r['pastActor_id'], $server).'</td>
						<td>'.date('d/m/y', $r['created']).'</td>
						<td>'.($r['expired'] == 0 ? 'Permanent' : secs_to_h($r['expired'] - $r['created'])).'</td>
						<td>'.UUIDtoPlayerName($r['actor_id'], $server).'</td>
						<td>'.date('d/m/y', $r['created']).'</td>'.($serverName ? '
						<td>'.$r['server'].'</td>' : '').($admin ? '
						<td class="admin-options"><a href="#" class="btn btn-danger delete" title="Remove" data-server="'.$_GET['server'].'" data-record-id="'.$r['id'].'"><span class="glyphicon glyphicon-trash"></span></a></td>' : '').'
					</tr>';
					++$i;
				}
			}
				?>

				</tbody>
			</table><?php
		}

		if((isset($settings['player_warnings']) && $settings['player_warnings']) || !isset($settings['player_warnings'])) {
			?>
			<br />
			<table class="table table-striped table-bordered" id="previous-warnings">
				<caption>Warnings</caption>
				<thead>
					<tr>
						<th>ID</th>
						<th>Reason</th>
						<th>By</th>
						<th>On</th><?php
			if(!isset($pastWarnings[0]) || (isset($pastWarnings[0]) && !is_array($pastWarnings[0])))
				$pastWarnings = array($pastWarnings);
			$serverName = false;
			foreach($pastWarnings as $r) {
				if(!empty($r['server'])) {
					$serverName = true;
					break;
				}
			}
			if($serverName) {
				echo '
						<th>Server</th>';
			}
			if($admin)
				echo '
						<th></th>';
				?>

					</tr>
				</thead>
				<tbody><?php
			if(isset($pastWarnings[0]) && count($pastWarnings[0]) == 0) {
				echo '
					<tr>
						<td colspan="8">None</td>
					</tr>';
			} else {
				$i = 1;
				foreach($pastWarnings as $r) {
					$r['reason'] = str_replace(array('&quot;', '"'), array('&#039;', '\''), $r['reason']);
					$r['created'] = $r['created'] + $mysqlSecs;

					echo '
					<tr>
						<td>'.$i.'</td>
						<td>'.$r['reason'].'</td>
						<td>'.UUIDtoPlayerName($r['actor_id'], $server).'</td>
						<td>'.date('H:i:s d/m/y', $r['created']).'</td>'.($serverName ? '
						<td>'.$r['server'].'</td>' : '').($admin ? '
						<td class="admin-options"><a href="#" class="btn btn-danger delete" title="Remove" data-server="'.$_GET['server'].'" data-record-id="'.$r['id'].'"><span class="glyphicon glyphicon-trash"></span></a></td>' : '').'
					</tr>';
					++$i;
				}
			}
				?>

				</tbody>
			</table><?php
		}

		if((isset($settings['player_kicks']) && $settings['player_kicks']) || !isset($settings['player_kicks'])) {
		?>
			<br />
			<table class="table table-striped table-bordered" id="previous-kicks">
				<caption>Kicks</caption>
				<thead>
					<tr>
						<th>ID</th>
						<th>Reason</th>
						<th>By</th>
						<th>At</th><?php
			if(isset($pastKicks[0]) && !is_array($pastKicks[0]))
				$pastKicks = array($pastKicks);
			$serverName = false;
			foreach($pastKicks as $r) {
				if(!empty($r['server'])) {
					$serverName = true;
					break;
				}
			}
			if($serverName) {
					echo '
						<th>Server</th>';
			}
			if($admin)
				echo '
						<th></th>';
				?>

					</tr>
				</thead>
				<tbody><?php
			if(count($pastKicks) == 0) {
				echo '
					<tr>
						<td colspan="8">None</td>
					</tr>';
			} else {
				$i = 1;
				foreach($pastKicks as $r) {
					$r['reason'] = str_replace(array('&quot;', '"'), array('&#039;', '\''), $r['reason']);
					$r['created'] = $r['created'] + $mysqlSecs;
					echo '
					<tr>
						<td>'.$i.'</td>
						<td>'.$r['reason'].'</td>
						<td>'.UUIDtoPlayerName($r['actor_id'], $server).'</td>
						<td>'.date('d/m/y', $r['created']).'</td>'.($serverName ? '
						<td>'.$r['server'].'</td>' : '').($admin ? '
						<td class="admin-options"><a href="#" class="btn btn-danger delete" title="Remove" data-server="'.$_GET['server'].'" data-record-id="'.$r['id'].'"><span class="glyphicon glyphicon-trash"></span></a></td>' : '').'
					</tr>';
					++$i;
				}
			}
				?>

				</tbody>
			</table><?php
		} ?>
		</div>
	</div>
		<?php
	}
}
?>
