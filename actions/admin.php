<?php

if(empty($settings['password']) || $settings['password'] == 'password')
	errors('You have not set a password. For your security, it\'s required that you set one.');
else if(isset($_SESSION['failed_attempts']) && $_SESSION['failed_attempts'] > 4) {
	die(errors('You have reached the maximum number of attempts. Please try again in 30 minutes.'));
	if($_SESSION['failed_attempt'] < time())
		unset($_SESSION['failed_attempts']);
} else if(!isset($_SESSION['admin']) && !isset($_POST['password'])) {
	?><form action="" method="post" class="well form-inline">
	<h3><?= $language['admin']['login']['header']; ?> <small>&mdash; <?= $language['admin']['login']['description']; ?></small></h3>
	<div class="row">
		<div class="col-lg-6">
		<?php
			if(!empty($errors)){
				foreach ($errors as $error) {
					echo $error;
				}
			}
		?>
			<div class="input-group">
			<input type="password" class="form-control" name="password" placeholder="<?= $language['admin']['login']['password']; ?>">
				<span class="input-group-btn">
				<button class="btn btn-info" type="submit"><?= $language['admin']['login']['button-signin']; ?></button>
					</span>
				</div>
			</div>
		</div>
		</form><?php
} else if(isset($_POST['password']) && !isset($_SESSION['admin'])) {
	if(htmlspecialchars_decode($_POST['password'], ENT_QUOTES) != $settings['password']) {
		//set how long we want them to have to wait after 5 wrong attempts
		$time = 1800; //make them wait 30 mins
		if(isset($_SESSION['failed_attempts']))
			++$_SESSION['failed_attempts'];
		else
			$_SESSION['failed_attempts'] = 1;
		$_SESSION['failed_attempt'] = time() + $time;
		errors($language['admin']['fail-wrong_password']);
	} else {
		$_SESSION['admin'] = true;
		redirect('index.php?action=admin');
	}
} else if(isset($_SESSION['admin']) && $_SESSION['admin']) {
	?>
	<div class="alert alert-info updatecheck" role="alert"><?= $language['admin']['update-alert']; ?></div>

	<table class="table table-striped table-bordered" id="servers">
		<thead>
			<tr>
				<th><?= $language['admin']['server-name']; ?></th>
				<th><?= $language['admin']['server-options']; ?></th>
			</tr>
		</thead>
		<tbody><?php
	if(empty($settings['servers']))
		echo '<tr id="noservers"><td colspan="2">'.$language['admin']['server-none'].'</td></tr>';
	else {
		$id = array_keys($settings['servers']);
		$i = 0;
		$count = count($settings['servers']) - 1;

		foreach($settings['servers'] as $server) {
			echo '
				<tr>
					<td>'.$server['name'].'</td>
					<td>
						<a href="#" class="btn btn-danger deleteServer" data-serverid="'.$id[$i].'"><span class="glyphicon glyphicon-trash"></span></a>';
			if($count > 0) {
				if($i == 0)
					echo '
					<a href="#" class="btn reorderServer" data-order="down" data-serverid="'.$id[$i].'"><span class="glyphicon glyphicon-arrow-down"></span></a>';
				else if($i == $count)
					echo '
					<a href="#" class="btn reorderServer" data-order="up" data-serverid="'.$id[$i].'"><span class="glyphicon glyphicon-arrow-up"></span></a>';
				else {
					echo '
					<a href="#" class="btn reorderServer" data-order="up" data-serverid="'.$id[$i].'"><span class="glyphicon glyphicon-arrow-up"></span></a>
					<a href="#" class="btn reorderServer" data-order="down" data-serverid="'.$id[$i].'"><span class="glyphicon glyphicon-arrow-down"></span></a>';
				}
			}
			echo '
					</td>
				</tr>';
			++$i;
		}
	}
		?>

		</tbody>
		<tfoot>
			<tr>
				<td colspan="2"><a class="btn btn-primary btn-large" href="#addserver" data-toggle="modal"><?= $language['admin']['server-button-add']; ?></a></td>
			</tr>
		</tfoot>
	</table>
	<div class="modal fade" id="addserver">
		<div class="modal-dialog">
			<div class="modal-content">
				<form class="form-horizontal" action="" method="post">
					<div class="modal-header">
						<button type="button" class="close" data-dismiss="modal">&times;</button>
						<h3><?= $language['admin']['addserver']['header']; ?></h3>
					</div>
					<div class="modal-body">
						<div class="container">
							<div class="form-group">
								<label class="control-label" for="servername"><?= $language['admin']['addserver']['server-name']; ?>:</label>
								<div class="controls">
									<input type="text" class="form-control required fixedWidth" name="servername" id="servername">
								</div>
							</div>
							<div class="form-group">
								<label class="control-label" for="host"><?= $language['admin']['addserver']['mysql-host']; ?>:</label>
								<div class="controls">
									<input type="text" class="form-control required fixedWidth" name="host" id="host">
								</div>
							</div>
							<div class="form-group">
								<label class="control-label" for="database"><?= $language['admin']['addserver']['mysql-database']; ?>:</label>
								<div class="controls">
									<input type="text" class="form-control required fixedWidth" name="database" id="database">
								</div>
							</div>
							<div class="form-group">
								<label class="control-label" for="username"><?= $language['admin']['addserver']['mysql-username']; ?>:</label>
								<div class="controls">
									<input type="text" class="form-control required fixedWidth" name="username" id="usernme">
								</div>
							</div>
							<div class="form-group">
								<label class="control-label" for="password"><?= $language['admin']['addserver']['mysql-password']; ?>:</label>
								<div class="controls">
									<input type="password" class="form-control fixedWidth" name="password" id="password">
								</div>
							</div>
							<div class="form-group">
								<label class="control-label" for="playerstable"><?= $language['admin']['addserver']['table-players']; ?>:</label>
								<div class="controls">
									<input type="text" class="form-control required fixedWidth" name="playerstable" id="playerstable" value="bm_players">
								</div>
							</div>
							<div class="form-group">
								<label class="control-label" for="playerbanstable"><?= $language['admin']['addserver']['table-player-bans']; ?>:</label>
								<div class="controls">
									<input type="text" class="form-control required fixedWidth" name="playerbanstable" id="playerbanstable" value="bm_player_bans">
								</div>
							</div>
							<div class="form-group">
								<label class="control-label" for="playerbanrecordstable"><?= $language['admin']['addserver']['table-player-ban-records']; ?>:</label>
								<div class="controls">
									<input type="text" class="form-control required fixedWidth" name="playerbanrecordstable" id="playerbanrecordstable" value="bm_player_ban_records">
								</div>
							</div>
							<div class="form-group">
								<label class="control-label" for="playermutestable"><?= $language['admin']['addserver']['table-player-mutes']; ?>:</label>
								<div class="controls">
									<input type="text" class="form-control required fixedWidth" name="playermutestable" id="playermutestable" value="bm_player_mutes">
								</div>
							</div>
							<div class="form-group">
								<label class="control-label" for="playermuterecordstable"><?= $language['admin']['addserver']['table-player-mute-records']; ?>:</label>
								<div class="controls">
									<input type="text" class="form-control required fixedWidth" name="playermuterecordstable" id="playermuterecordstable" value="bm_player_mute_records">
								</div>
							</div>
							<div class="form-group">
								<label class="control-label" for="playerkickstable"><?= $language['admin']['addserver']['table-player-kicks']; ?>:</label>
								<div class="controls">
									<input type="text" class="form-control required fixedWidth" name="playerkickstable" id="playerkickstable" value="bm_player_kicks">
								</div>
							</div>
							<div class="form-group">
								<label class="control-label" for="playerwarningstable"><?= $language['admin']['addserver']['table-player-mutes']; ?>:</label>
								<div class="controls">
									<input type="text" class="form-control required fixedWidth" name="playerwarningstable" id="playerwarningstable" value="bm_player_warnings">
								</div>
							</div>
							<div class="form-group">
								<label class="control-label" for="ipbanstable"><?= $language['admin']['addserver']['table-ipbans']; ?>:</label>
								<div class="controls">
									<input type="text" class="form-control required fixedWidth" name="ipbanstable" id="ipbanstable" value="bm_ip_bans">
								</div>
							</div>
							<div class="form-group">
								<label class="control-label" for="ipbanrecordstable"><?= $language['admin']['addserver']['table-ipban-records']; ?>:</label>
								<div class="controls">
									<input type="text" class="form-control required fixedWidth" name="ipbanrecordstable" id="ipbanrecordstable" value="bm_ip_ban_records">
								</div>
							</div>
							<div class="form-group">
								<label class="control-label" for="consoleid"><?= $language['admin']['addserver']['consoleid']; ?>:</label>
								<div class="controls">
									<input type="text" class="form-control required fixedWidth" name="consoleid" id="consoleid">
								</div>
							</div>
						</div>
					</div>
					<div class="modal-footer">
						<a href="#" class="btn" data-dismiss="modal"><?= $language['admin']['addserver']['button-close']; ?></a>
						<input type="submit" class="btn btn-primary" value="<?= $language['admin']['addserver']['button-save']; ?>" />
					</div>
				</form>
			</div>
		</div>
	</div>
	<br />
	<br />
	<h3><?= $language['admin']['homepage']['header']; ?> <small><?= $language['admin']['homepage']['description']; ?></small></h3>
	<form class="form-horizontal settings" action="" method="post">
		<table class="table table-striped table-bordered table-hover">
			<thead>
				<tr>
					<th><?= $language['admin']['homepage']['option']; ?></th>
					<th><?= $language['admin']['homepage']['value']; ?></th>
				</tr>
			</thead>
			<tbody>
	<?php
	if(!is_writable('settings.php')) {
		echo '
				<tr>
					<td colspan="2">settings.php can not be written to</td>
				</tr>';
	} else {
		echo '
				<tr>
					<td>'.$language['admin']['homepage']['iframe_protection'].'</td>
					<td><input type="hidden" name="type" value="mainsettings" /><input type="checkbox" name="iframe"'.((isset($settings['iframe_protection']) && $settings['iframe_protection']) || !isset($settings['iframe_protection']) ? ' checked="checked"' : '').' /></td>
				</tr>
				<tr>
					<td>'.$language['admin']['homepage']['utf8'].'</td>
					<td><input type="checkbox" name="utf8"'.(isset($settings['utf8']) && $settings['utf8'] ? ' checked="checked"' : '').' /></td>
				</tr>
				<tr>
					<td>'.$language['admin']['homepage']['footer'].'</td>
					<td><input type="text" class="form-control" name="footer" value="'.$settings['footer'].'" /></td>
				</tr>
				<tr>
					<td>'.$language['admin']['homepage']['latest_bans'].'</td>
					<td><input type="checkbox" name="latestbans"'.((isset($settings['latest_bans']) && $settings['latest_bans']) || !isset($settings['latest_bans']) ? ' checked="checked"' : '').' /></td>
				</tr>
				<tr>
					<td>'.$language['admin']['homepage']['latest_mutes'].'</td>
					<td><input type="checkbox" name="latestmutes"'.(isset($settings['latest_mutes']) && $settings['latest_mutes'] ? ' checked="checked"' : '').' /></td>
				</tr>
				<tr>
					<td>'.$language['admin']['homepage']['latest_warnings'].'</td>
					<td><input type="checkbox" name="latestwarnings"'.(isset($settings['latest_warnings']) && $settings['latest_warnings'] ? ' checked="checked"' : '').' /></td>
				</tr>
				<tr>
					<td>'.$language['admin']['homepage']['html-before'].'</td>
					<td><input type="text" class="form-control" name="buttons_before" value="'.(isset($settings['submit_buttons_before_html']) ? $settings['submit_buttons_before_html'] : '').'" /></td>
				</tr>
				<tr>
					<td>'.$language['admin']['homepage']['html-after'].'</td>
					<td><input type="text" class="form-control" name="buttons_after" value="'.(isset($settings['submit_buttons_after_html']) ? $settings['submit_buttons_after_html'] : '').'" /></td>
				</tr>';
	} ?>

			</tbody>
			<tfoot>
				<tr>
					<td colspan="2">
	<?php
	if(!is_writable('settings.php')) {
		echo '<input type="submit" class="btn btn-primary btn-large disabled" disabled="disabled" value="'.$language['admin']['homepage']['button-save'].'" />';
	} else {
		echo '<input type="submit" class="btn btn-primary btn-large" value="'.$language['admin']['homepage']['button-save'].'" />';
	} ?>

					</td>
				</tr>
			</tfoot>
		</table>
	</form>
	<br />
	<br />
	<h3><?= $language['admin']['viewplayer']['header']; ?></h3>
	<form class="form-horizontal settings" action="" method="post">
		<table class="table table-striped table-bordered table-hover">
			<thead>
				<tr>
					<th><?= $language['admin']['viewplayer']['visible']; ?></th>
					<th><?= $language['admin']['viewplayer']['value']; ?></th>
				</tr>
			</thead>
			<tbody>
	<?php
	if(!is_writable('settings.php')) {
		echo '
				<tr>
					<td colspan="2">settings.php can not be written to</td>
				</tr>';
	} else {
		echo '
				<tr>
					<td>'.$language['admin']['viewplayer']['current_ban'].'</td>
					<td><input type="hidden" name="type" value="viewplayer" /><input type="checkbox" name="ban"'.((isset($settings['player_current_ban']) && $settings['player_current_ban']) || !isset($settings['player_current_ban']) ? ' checked="checked"' : '').' /></td>
				</tr>
				<tr>
					<td>'.$language['admin']['viewplayer']['current_ban-html'].'</td>
					<td><input type="input" class="form-control" name="banextra"'.(isset($settings['player_current_ban_extra_html']) ? ' value="'.$settings['player_current_ban_extra_html'].'"' : '').' /></td>
				</tr>
				<tr>
					<td>'.$language['admin']['viewplayer']['current_mute'].'</td>
					<td><input type="checkbox" name="mute"'.((isset($settings['player_current_mute']) && $settings['player_current_mute']) || !isset($settings['player_current_mute']) ? ' checked="checked"' : '').' /></td>
				</tr>
				<tr>
					<td>'.$language['admin']['viewplayer']['current_mute-html'].'</td>
					<td><input type="input" class="form-control" name="muteextra"'.(isset($settings['player_current_mute_extra_html']) ? ' value="'.$settings['player_current_mute_extra_html'].'"' : '').' /></td>
				</tr>
				<tr>
					<td>'.$language['admin']['viewplayer']['previous_bans'].'</td>
					<td><input type="checkbox" name="prevbans"'.((isset($settings['player_previous_bans']) && $settings['player_previous_bans']) || !isset($settings['player_previous_bans']) ? ' checked="checked"' : '').' /></td>
				</tr>
				<tr>
					<td>'.$language['admin']['viewplayer']['previous_mutes'].'</td>
					<td><input type="checkbox" name="prevmutes"'.((isset($settings['player_previous_mutes']) && $settings['player_previous_mutes']) || !isset($settings['player_previous_mutes']) ? ' checked="checked"' : '').' /></td>
				</tr>
				<tr>
					<td>'.$language['admin']['viewplayer']['warnings'].'</td>
					<td><input type="checkbox" name="warnings"'.((isset($settings['player_warnings']) && $settings['player_warnings']) || !isset($settings['player_warnings']) ? ' checked="checked"' : '').' /></td>
				</tr>
				<tr>
					<td>'.$language['admin']['viewplayer']['kicks'].'</td>
					<td><input type="checkbox" name="kicks"'.((isset($settings['player_kicks']) && $settings['player_kicks']) || !isset($settings['player_kicks']) ? ' checked="checked"' : '').' /></td>
				</tr>';
	} ?>

			</tbody>
			<tfoot>
				<tr>
					<td colspan="2">
	<?php
	if(!is_writable('settings.php')) {
		echo '<input type="submit" class="btn btn-primary btn-large disabled" disabled="disabled" value="'.$language['admin']['viewplayer']['button-save'].'" />';
	} else {
		echo '<input type="submit" class="btn btn-primary btn-large" value="'.$language['admin']['viewplayer']['button-save'].'" />';
	} ?>

					</td>
				</tr>
			</tfoot>
		</table>
	</form>
	<br />
	<br />
	<h3><?= $language['admin']['miscellaneous']['header']; ?></h3>
	<a href="index.php?action=deletecache&authid=<?php echo sha1($settings['password']); ?>" class="btn btn-primary"><?= $language['admin']['miscellaneous']['clear_cache']; ?></a>
	<?php
}
?>
