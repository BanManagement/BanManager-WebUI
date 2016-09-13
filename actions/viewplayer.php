<?php

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

	// Check if the player exists
	$currentBans = cache("SELECT b.id, reason, created, expires, a.name AS actor_name FROM ".$server['playerBansTable']." b JOIN ".$server['playersTable']." a ON b.actor_id = a.id WHERE player_id = UNHEX('".$UUID."')", $settings['cache_viewplayer'], $_GET['server'].'/players', $server);
	$pastBans = cache("SELECT b.id, reason, created, expired, a.name AS actor_name, pa.name AS pastActor_name, pastCreated FROM ".$server['playerBanRecordsTable']." b LEFT OUTER JOIN ".$server['playersTable']." a ON b.actor_id = a.id JOIN ".$server['playersTable']." pa ON b.pastActor_id = pa.id WHERE player_id = UNHEX('".$UUID."') AND pastCreated <> 0", $settings['cache_viewplayer'], $_GET['server'].'/players', $server);
	$currentMutes = cache("SELECT b.id, reason, created, expires, a.name AS actor_name FROM ".$server['playerMutesTable']." b JOIN ".$server['playersTable']." a ON b.actor_id = a.id WHERE player_id = UNHEX('".$UUID."')", $settings['cache_viewplayer'], $_GET['server'].'/players', $server);
	$pastMutes = cache("SELECT b.id, reason, created, expired, a.name AS actor_name, pa.name AS pastActor_name, pastCreated FROM ".$server['playerMuteRecordsTable']." b LEFT OUTER JOIN ".$server['playersTable']." a ON b.actor_id = a.id JOIN ".$server['playersTable']." pa ON b.pastActor_id = pa.id WHERE player_id = UNHEX('".$UUID."')", $settings['cache_viewplayer'], $_GET['server'].'/players', $server);
	$pastKicks = cache("SELECT b.id, reason, created, a.name AS actor_name FROM ".$server['playerKicksTable']." b JOIN ".$server['playersTable']." a ON b.actor_id = a.id WHERE player_id = UNHEX('".$UUID."')", $settings['cache_viewplayer'], $_GET['server'].'/players', $server);
	$pastWarnings = cache("SELECT b.id, reason, created, a.name AS actor_name FROM ".$server['playerWarningsTable']." b JOIN ".$server['playersTable']." a ON b.actor_id = a.id WHERE player_id = UNHEX('".$UUID."')", $settings['cache_viewplayer'], $_GET['server'].'/players', $server);

	if(count($currentBans) == 0 && count($pastBans) == 0 && count($currentMutes) == 0 && count($pastMutes) == 0 && count($pastKicks) == 0 && $pastWarnings == 0) {
		errors('Player does not exist');
		?><a href="index.php" class="btn btn-primary"><?= $language['viewplayer']['new_search']; ?></a><?php
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
							<div><img src="<?php echo str_replace(array('%name%', '%uuid%'), array($_GET['player'], $UUID), $settings['skin']['complete']) ?>" class="skin-complete" alt="<?php echo $_GET['player'];?>"/></div>
							<span id="player_name" title="UUID: <?php echo $UUID;?>"><?php echo $_GET['player'];?></span>
					</div>
			</div>
			<div class="col-lg-9" id="player_ban_info">
					<h4><?= $language['viewplayer']['current_server']; ?>: <?php echo $server['name']; ?></h4>
		<?php
		$id = array_keys($settings['servers']);
		$i = 0;
		$html = '';
		if(count($settings['servers']) > 1) {
			echo '
			<p>'.$language['viewplayer']['change_server'].': ';
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
				<caption><?= $language['viewplayer']['current_ban']['current_ban']; ?></caption>
				<tbody>
				<?php
			if(count($currentBans) == 0) {
				echo '
					<tr>
						<td colspan="2">'.$language['viewplayer']['current_ban']['none'].'</td>
					</tr>';
			} else {
				$reason = str_replace(array('&quot;', '"'), array('&#039;', '\''), $currentBans['reason']);
				echo '
					<tr>
						<td>'.$language['viewplayer']['current_ban']['expires_in'].':</td>
						<td class="expires">';
				if($currentBans['expires'] == 0)
					echo '<span class="label label-danger">'.$language['viewplayer']['current_ban']['permanent'].'</span>';
				else {
					$currentBans['expires'] = $currentBans['expires'] + $mysqlSecs;
					$currentBans['created'] = $currentBans['created'] + $mysqlSecs;
					$expires = $currentBans['expires'] - time();

					if($expires > 0)
						echo '<time datetime="'.date('c', $currentBans['expires']).'">'.secs_to_h($expires).'</time>';
					else
						echo $language['viewplayer']['current_ban']['now'];
				}

				echo '</td>
					</tr>
					<tr>
						<td>'.$language['viewplayer']['current_ban']['banned_by'].':</td>
						<td>'.$currentBans['actor_name'].'</td>
					</tr>
					<tr>
						<td>'.$language['viewplayer']['current_ban']['banned_at'].':</td>
						<td>'.date($language['viewplayer']['date-format'], $currentBans['created']).'</td>
					</tr>
					<tr>
						<td>'.$language['viewplayer']['current_ban']['ban_reason'].':</td>
						<td class="reason">'.$currentBans['reason'].'</td>
					</tr>';
				if(!empty($currentBans['server'])) {
					echo '
					<tr>
						<td>'.$language['viewplayer']['current_ban']['banned_at'].':</td>
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
							<a class="btn btn-warning edit" title="'.$language['viewplayer']['current_ban']['edit'].'" href="#editban" data-toggle="modal"><span class="glyphicon glyphicon-pencil"></span> '.$language['viewplayer']['current_ban']['edit'].'</a>
							<a class="btn btn-danger delete" title="'.$language['viewplayer']['current_ban']['unban'].'" data-role="confirm" href="index.php?action=deleteban&ajax=true&authid='.sha1($settings['password']).'&server='.$_GET['server'].'&id='.$currentBans['id'].'" data-confirm-title="'.sprintf($language['viewplayer']['current_ban']['unban_modal-title'], $_GET['player']).'" data-confirm-body="'.sprintf($language['viewplayer']['current_ban']['unban_modal-body'], $_GET['player']).'"><span class="glyphicon glyphicon-trash"></span> '.$language['viewplayer']['current_ban']['unban'].'</a>
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
								<h3><?= $language['viewplayer']['current_ban']['edit_modal-editing_ban']; ?></h3>
							</div>
							<div class="modal-body">
								<div class="control-group">
									<label class="control-label" for="yourtime"><?= $language['viewplayer']['current_ban']['edit_modal-your_time']; ?>:</label>
									<div class="controls">
										<span class="yourtime"></span>
									</div>
								</div>
								<div class="control-group">
									<label class="control-label" for="servertime"><?= $language['viewplayer']['current_ban']['edit_modal-server_time']; ?>:</label>
									<div class="controls">
										<span class="servertime"><?php echo date('d/m/Y H:i:s', time() + $mysqlSecs); ?></span>
									</div>
								</div>
								<div class="control-group">
									<label class="control-label" for="bandatetime"><?= $language['viewplayer']['current_ban']['edit_modal-expires_server_time']; ?>:</label>
									<div class="controls">
										<div class="input-group date datetimepicker">
										<?php
											echo '
											<span class="input-group-btn">
												<button class="btn btn-danger bantype" type="button">';
											if($currentBans['expires'] == 0)
												echo $language['viewplayer']['current_ban']['edit_modal-permanent'];
											else
												echo $language['viewplayer']['current_ban']['edit_modal-temporary'];

											echo '</button>
											</span>
											<input type="text" class="form-control required';

											if($currentBans['expires'] == 0)
												echo ' disabled" disabled="disabled"';
											else
												echo '"';

											echo ' name="expires" data-format="DD/MM/YYYY HH:mm:ss" value="';

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
								<label for="banreason"><?= $language['viewplayer']['current_ban']['edit_modal-reason']; ?>:</label>
								<textarea id="banreason" name="reason" class="form-control" rows="4"><?php echo $currentBans['reason']; ?></textarea>
							</div>
							<div class="modal-footer">
								<a href="#" class="btn" data-dismiss="modal"><?= $language['viewplayer']['current_ban']['edit_modal-close']; ?></a>
								<input type="submit" class="btn btn-primary" value="<?= $language['viewplayer']['current_ban']['edit_modal-save']; ?>" />
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
				<caption><?= $language['viewplayer']['current_mute']['current_mute']; ?></caption>
				<tbody>
				<?php
			if(count($currentMutes) == 0) {
				echo '
					<tr>
						<td colspan="2">'.$language['viewplayer']['current_mute']['none'].'</td>
					</tr>';
			} else {
				$reason = str_replace(array('&quot;', '"'), array('&#039;', '\''), $currentMutes['reason']);
				echo '
					<tr>
						<td>'.$language['viewplayer']['current_mute']['expires_in'].':</td>
						<td class="expires">';
				if($currentMutes['expires'] == 0)
					echo '<span class="label label-danger">'.$language['viewplayer']['current_mute']['permanent'].'</span>';
				else {
					$currentMutes['expires'] = $currentMutes['expires'] + $mysqlSecs;
					$currentMutes['created'] = $currentMutes['created'] + $mysqlSecs;
					$expires = $currentMutes['expires'] - time();

					if($expires > 0)
						echo '<time datetime="'.date('c', $currentMutes['expires']).'">'.secs_to_h($expires).'</time>';
					else
						echo $language['viewplayer']['current_mute']['now'];
				}
				echo '</td>
					</tr>
					<tr>
						<td>'.$language['viewplayer']['current_mute']['muted_by'].':</td>
						<td>'.$currentMutes['actor_name'].'</td>
					</tr>
					<tr>
						<td>'.$language['viewplayer']['current_mute']['muted_at'].':</td>
						<td>'.date($language['viewplayer']['date-format'], $currentMutes['created']).'</td>
					</tr>
					<tr>
						<td>'.$language['viewplayer']['current_mute']['mute_reason'].':</td>
						<td class="reason">'.$currentMutes['reason'].'</td>
					</tr>
					<tr>';
				if(!empty($currentMutes['server'])) {
					echo '
					<tr>
						<td>'.$language['viewplayer']['current_mute']['server'].':</td>
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
							<a class="btn btn-warning edit" title="'.$language['viewplayer']['current_mute']['edit'].'" href="#editmute" data-toggle="modal"><span class="glyphicon glyphicon-pencil"></span> '.$language['viewplayer']['current_mute']['edit'].'</a>
							<a class="btn btn-danger delete" title="'.$language['viewplayer']['current_mute']['unmute'].'" data-role="confirm" href="index.php?action=deletemute&ajax=true&authid='.sha1($settings['password']).'&server='.$_GET['server'].'&id='.$currentMutes['id'].'" data-confirm-title="'.sprintf($language['viewplayer']['current_mute']['unmute_modal-title'], $_GET['player']).'" data-confirm-body="Are you sure you want to unmute '.$_GET['player'].'?<br />This cannot be undone"><span class="glyphicon glyphicon-trash"></span> Unmute</a>
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
								<h3><?= $language['viewplayer']['current_mute']['edit_modal-editing_mute'] ?></h3>
							</div>
							<div class="modal-body">
									<div class="control-group">
										<label class="control-label" for="yourtime"><?= $language['viewplayer']['current_mute']['edit_modal-your_time'] ?>:</label>
											<span class="yourtime"></span>
									</div>
									<div class="control-group">
										<label class="control-label" for="servertime"><?= $language['viewplayer']['current_mute']['edit_modal-server_time'] ?>:</label>
											<span class="servertime"><?php echo date('d/m/Y H:i:s', time() + $mysqlSecs); ?></span>
									</div>
								<!--	<div class="control-group">
										<label class="control-label" for="mutedatetime"><?= $language['viewplayer']['current_mute']['edit_modal-expires_server_time'] ?>:</label>
										<div class="input-group">
											<div class="input datetimepicker date">
											<?php
								/*
												echo '
												<div class="input-group-addon">
													<button class="btn btn-danger bantype" type="button">';
											if($currentMutes['expires'] == 0)
												echo $language['viewplayer']['current_mute']['edit_modal-permanent'];
											else
												echo $language['viewplayer']['current_mute']['edit_modal-temporary'];

											echo '</button>
													<input type="text" class="required';

											if($currentMutes['expires'] == 0)
												echo ' disabled" disabled="disabled"';
											else
												echo '"';

											echo ' name="expires" data-format="dd/MM/yyyy HH:mm:ss" value="';

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
									<div class="control-group">
										<label class="control-label" for="mutereason"><?= $language['viewplayer']['current_mute']['edit_modal-reason'] ?>:</label>
											<textarea id="mutereason" class="form-control" name="reason" rows="4"><?php echo $currentMutes['reason']; ?></textarea>
									</div>
								</div>
							<div class="modal-footer">
								<a href="#" class="btn" data-dismiss="modal"><?= $language['viewplayer']['current_mute']['edit_modal-close'] ?></a>
								<input type="submit" class="btn btn-primary" value="<?= $language['viewplayer']['current_mute']['edit_modal-your_time'] ?>" />
							</div>
							<input type="hidden" name="id" value="<?php echo $currentMutes['id']; ?>" />
							<input type="hidden" name="server" value="<?php echo $_GET['server']; ?>" />
							<input type="hidden" name="expiresTimestamp" value="<?php echo $currentMutes['expires']; ?>" />
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
				<caption><?= $language['viewplayer']['previous_bans']['previous_bans'] ?></caption>
				<thead>
					<tr>
						<th><?= $language['viewplayer']['previous_bans']['id'] ?></th>
						<th><?= $language['viewplayer']['previous_bans']['reason'] ?></th>
						<th><?= $language['viewplayer']['previous_bans']['by'] ?></th>
						<th><?= $language['viewplayer']['previous_bans']['on'] ?></th>
						<th><?= $language['viewplayer']['previous_bans']['length'] ?></th>
						<th><?= $language['viewplayer']['previous_bans']['unbanned_by'] ?></th>
						<th><?= $language['viewplayer']['previous_bans']['at'] ?></th><?php
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
						<th>'.$language['viewplayer']['previous_bans']['server'].'</th>';
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
						<td colspan="8">'.$language['viewplayer']['previous_bans']['none'].'</td>
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
						<td>'.$r['pastActor_name'].'</td>
						<td>'.date('H:i:s d/m/y', $r['pastCreated']).'</td>
						<td>'.($r['expired'] == 0 ? 'Permanent' : secs_to_h($r['expired'] - $r['pastCreated'])).'</td>
						<td>'.$r['actor_name'].'</td>
						<td>'.date('H:i:s d/m/y', $r['created']).'</td>'.($serverName ? '
						<td>'.$r['server'].'</td>' : '').($admin ? '
						<td class="admin-options"><a href="#" class="btn btn-danger delete btn-xs" title="'.$language['viewplayer']['previous_bans']['admin-remove'].'" data-server="'.$_GET['server'].'" data-record-id="'.$r['id'].'"><span class="glyphicon glyphicon-trash"></span></a></td>' : '').'
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
				<caption><?= $language['viewplayer']['previous_mutes']['previous_mutes'] ?></caption>
				<thead>
					<tr>
						<th><?= $language['viewplayer']['previous_mutes']['id'] ?></th>
						<th><?= $language['viewplayer']['previous_mutes']['reason'] ?></th>
						<th><?= $language['viewplayer']['previous_mutes']['by'] ?></th>
						<th><?= $language['viewplayer']['previous_mutes']['on'] ?></th>
						<th><?= $language['viewplayer']['previous_mutes']['length'] ?></th>
						<th><?= $language['viewplayer']['previous_mutes']['unmuted_by'] ?></th>
						<th><?= $language['viewplayer']['previous_mutes']['at'] ?></th><?php
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
						<th>'.$language['viewplayer']['previous_mutes']['server'].'</th>';
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
						<td colspan="8">'.$language['viewplayer']['previous_mutes']['none'].'</td>
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
						<td>'.$r['pastActor_name'].'</td>
						<td>'.date('d/m/y', $r['created']).'</td>
						<td>'.($r['expired'] == 0 ? 'Permanent' : secs_to_h($r['expired'] - $r['pastCreated'])).'</td>
						<td>'.$r['actor_name'].'</td>
						<td>'.date('d/m/y', $r['pastCreated']).'</td>'.($serverName ? '
						<td>'.$r['server'].'</td>' : '').($admin ? '
						<td class="admin-options"><a href="#" class="btn btn-danger delete btn-xs" title="'.$language['viewplayer']['previous_mutes']['admin-remove'].'" data-server="'.$_GET['server'].'" data-record-id="'.$r['id'].'"><span class="glyphicon glyphicon-trash"></span></a></td>' : '').'
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
			<table class="table table-striped table-bordered" id="warnings">
				<caption><?= $language['viewplayer']['warnings']['warnings'] ?></caption>
				<thead>
					<tr>
						<th><?= $language['viewplayer']['warnings']['id'] ?></th>
						<th><?= $language['viewplayer']['warnings']['reason'] ?></th>
						<th><?= $language['viewplayer']['warnings']['by'] ?></th>
						<th><?= $language['viewplayer']['warnings']['on'] ?></th><?php
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
						<th>'.$language['viewplayer']['warnings']['server'].'</th>';
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
						<td colspan="8">'.$language['viewplayer']['warnings']['none'].'</td>
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
						<td>'.$r['actor_name'].'</td>
						<td>'.date('H:i:s d/m/y', $r['created']).'</td>'.($serverName ? '
						<td>'.$r['server'].'</td>' : '').($admin ? '
						<td class="admin-options"><a href="#" class="btn btn-danger delete btn-xs" title="'.$language['viewplayer']['warnings']['admin-remove'].'" data-server="'.$_GET['server'].'" data-record-id="'.$r['id'].'"><span class="glyphicon glyphicon-trash"></span></a></td>' : '').'
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
				<caption><?= $language['viewplayer']['previous_kicks']['previous_kicks'] ?></caption>
				<thead>
					<tr>
						<th><?= $language['viewplayer']['previous_kicks']['id'] ?></th>
						<th><?= $language['viewplayer']['previous_kicks']['reason'] ?></th>
						<th><?= $language['viewplayer']['previous_kicks']['by'] ?></th>
						<th><?= $language['viewplayer']['previous_kicks']['at'] ?></th><?php
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
						<th>'.$language['viewplayer']['previous_kicks']['server'].'</th>';
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
						<td colspan="8">'.$language['viewplayer']['previous_kicks']['none'].'</td>
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
						<td>'.$r['actor_name'].'</td>
						<td>'.date('d/m/y', $r['created']).'</td>'.($serverName ? '
						<td>'.$r['server'].'</td>' : '').($admin ? '
						<td class="admin-options"><a href="#" class="btn btn-danger delete btn-xs" title="'.$language['viewplayer']['previous_kicks']['admin-remove'].'" data-server="'.$_GET['server'].'" data-record-id="'.$r['id'].'"><span class="glyphicon glyphicon-trash"></span></a></td>' : '').'
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
