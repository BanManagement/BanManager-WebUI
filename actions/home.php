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

function latestBans($server, $serverID) {
	global $settings;

	// Clear old latest bans cache's
	clearCache($serverID.'/latestbans', 300);
	clearCache($serverID.'/mysqlTime', 300);

	$result = cache("SELECT HEX(player_id) AS player_id, HEX(actor_id) AS actor_id, reason, created, expires FROM ".$server['playerBansTable']." ORDER BY created DESC LIMIT ".$settings['widget_bans_count'], $settings['cache_home'], $serverID.'/search', $server);

	if(isset($result[0]) && !is_array($result[0]) && !empty($result[0])){
		$result = array($result);
	}

	$rows = count($result);

	if($rows == 0){
		echo '<li><span class="label label-info">No Records</span></li>';
	}	else {
		$timeDiff = cache('SELECT ('.time().' - UNIX_TIMESTAMP(now()))/3600 AS mysqlTime', 5, $serverID.'/mysqlTime', $server); // Cache it for a few seconds

		$mysqlTime = $timeDiff['mysqlTime'];
		$mysqlTime = ($mysqlTime > 0)  ? floor($mysqlTime) : ceil ($mysqlTime);
		$mysqlSecs = ($mysqlTime * 60) * 60;
		foreach($result as $r) {
			$playername = UUIDtoPlayerName($r['player_id'], $server);
			$actorname = UUIDtoPlayerName($r['actor_id'], $server);

			$expires = ($r['expires'] + $mysqlSecs)- time();
			echo '
					<li class="latestban"><a href="index.php?action=viewplayer&player='.$playername.'&server='.$serverID.'"><img src="https://minotar.net/helm/'.$playername.'/23" alt="'.$playername.'" class="minihead" /> '.$playername.'</a><button class="btn btn-info ban-info" rel="popover" data-html="true" data-content="'.$r['reason'].'" data-original-title="'.$actorname;
			if($r['expires'] == 0)
				echo ' <span class=\'label label-danger\'>Never</span>';
			else if($expires > 0)
				echo ' <span class=\'label label-warning\'>'.secs_to_hmini($expires).'</span>';
			else
				echo ' <span class=\'label label-success\'>Now</span>';
			echo '"><span class="glyphicon glyphicon-info-sign"></span></button></li>';
		}
	}
}

function latestMutes($server, $serverID) {
	global $settings;

	// Clear old latest mutes cache's
	clearCache($serverID.'/latestmutes', 300);
	clearCache($serverID.'/mysqlTime', 300);

	$result = cache("SELECT HEX(player_id) AS player_id, HEX(actor_id) AS actor_id, reason, created, expires FROM ".$server['playerMutesTable']." ORDER BY created DESC LIMIT ".$settings['widget_mutes_count'], $settings['cache_home'], $serverID.'/search', $server);

	if(isset($result[0]) && !is_array($result[0]) && !empty($result[0])) {
		$result = array($result);
	}

	$rows = count($result);

	if($rows == 0){
		echo '<li><span class="label label-info">No Records</span></li>';
	} else {
		$timeDiff = cache('SELECT ('.time().' - UNIX_TIMESTAMP(now()))/3600 AS mysqlTime', 5, $serverID.'/mysqlTime', $server); // Cache it for a few seconds

		$mysqlTime = $timeDiff['mysqlTime'];
		$mysqlTime = ($mysqlTime > 0)  ? floor($mysqlTime) : ceil ($mysqlTime);
		$mysqlSecs = ($mysqlTime * 60) * 60;
		foreach($result as $r) {
			$playername = UUIDtoPlayerName($r['player_id'], $server);
			$actorname = UUIDtoPlayerName($r['actor_id'], $server);

			$expires = ($r['expires'] + $mysqlSecs)- time();
			echo '<li class="latestban"><a href="index.php?action=viewplayer&player='.$playername.'&server='.$serverID.'"><img src="https://minotar.net/helm/'.$playername.'/23" alt="'.$playername.'" class="minihead" /> '.$playername.'</a><button class="btn btn-info ban-info" rel="popover" data-html="true" data-content="'.$r['reason'].'" data-original-title="'.$actorname;
			if($r['expires'] == 0)
				echo ' <span class=\'label label-danger\'>Never</span>';
			else if($expires > 0)
				echo ' <span class=\'label label-warning\'>'.secs_to_hmini($expires).'</span>';
			else
				echo ' <span class=\'label label-success\'>Now</span>';
			echo '"><span class="glyphicon glyphicon-info-sign"></span></button></li>';
		}
	}
}

function latestWarnings($server, $serverID) {
	global $settings;

	// Clear old latest warnings cache's
	clearCache($serverID.'/latestwarnings', 300);
	clearCache($serverID.'/mysqlTime', 300);

	$result = cache("SELECT HEX(player_id) AS player_id, HEX(actor_id) AS actor_id, reason, created FROM ".$server['playerWarningsTable']." ORDER BY created DESC LIMIT ".$settings['widget_warnings_count'], $settings['cache_home'], $serverID.'/search', $server);

	if(isset($result[0]) && !is_array($result[0]) && !empty($result[0])){
		$result = array($result);
	}

	$rows = count($result);

	if($rows == 0) {
		echo '<li><span class="label label-info">No Records</span></li>';
	} else {
		$timeDiff = cache('SELECT ('.time().' - UNIX_TIMESTAMP(now()))/3600 AS mysqlTime', 5, $serverID.'/mysqlTime', $server); // Cache it for a few seconds

		$mysqlTime = $timeDiff['mysqlTime'];
		$mysqlTime = ($mysqlTime > 0)  ? floor($mysqlTime) : ceil ($mysqlTime);
		$mysqlSecs = ($mysqlTime * 60) * 60;
		foreach($result as $r) {
			$playername = UUIDtoPlayerName($r['player_id'], $server);
			$actorname = UUIDtoPlayerName($r['actor_id'], $server);

			echo '<li class="latestban"><a href="index.php?action=viewplayer&player='.$playername.'&server='.$serverID.'"><img src="https://minotar.net/helm/'.$playername.'/23" alt="'.$playername.'" class="minihead" /> '.$playername.'</a><button class="btn btn-info ban-info" rel="popover" data-html="true" data-content="'.$r['reason'].'" data-original-title="'.$actorname.'"><span class="glyphicon glyphicon-info-sign"></span></button></li>';
		}
	}
}
?>
<div class="jumbotron">
	<div class="row">
		<div class="col-lg-6">
			<h1><?php echo $language['header-title']; ?></h1>
			<form action="index.php" method="get" class="form-horizontal" id="search">
						<div class="input-group">
						<div class="input-group-btn">
								<button id="player" type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">Player <span class="caret"></span></button>
						<ul class="dropdown-menu">
							<li id="ip"><a href="#">Search by IP Address</a></li>
						</ul>
					</div>
					<input type="text" name="player" class="form-control" placeholder="Search by username">
					</div>
			<?php
			if(!empty($settings['servers']) && count($settings['servers']) > 1) {
				echo '
				<div class="form-group">
					<label for="servername" class="col-lg-2 control-label">Server:</label>
					<div class="col-lg-10">
					';
				$id = array_keys($settings['servers']);
				$i = 0;
				foreach($settings['servers'] as $server) {
					echo '
							<div class="radio">
								<label>
									<input type="radio" class="server-option" value="'.$id[$i].'" name="server"'.($i == 0 ? ' checked="checked"' : '').' />
									'.$server['name'].'
								</label>
							</div>';
					++$i;
				}
				echo '
					</div>
				</div>';
			} else if(count($settings['servers']) == 1) {
				echo '<input type="hidden" value="0" name="server" />';
			}
			?>
				<div class="form-actions">
				<?php
					if(isset($settings['submit_buttons_before_html']))
						echo htmlspecialchars_decode($settings['submit_buttons_before_html'], ENT_QUOTES);
				?>
					<input type="hidden" name="action" value="searchplayer" />
					<div class="btn-group">
						<button type="submit" class="btn btn-primary">Search</button>
						<button type="button" class="btn btn-primary" id="viewall">Display All</button>
					</div>
					<?php
					if(isset($settings['submit_buttons_after_html']))
						echo htmlspecialchars_decode($settings['submit_buttons_after_html'], ENT_QUOTES);
					?>
				</div>
				</form>
		</div>
		<div class="col-lg-6">
			<div class="panel panel-jumbotron">
				<div class="panel-body">
		<?php
		if(isset($settings['bm_info']) && $settings['bm_info']) {
		?>
					<p>
						<span>

						<?php
							if(isset($settings['bm_info_icon']) && $settings['bm_info_icon']){
								echo '<span class="glyphicon glyphicon-info-sign"></span> ';
							}

						?>
						<?php
							echo $language['brand'];
						?>

						</span><br />

						<?php echo $language['bm_info_text']; ?>
					</p>
		<?php
		}

		if(isset($settings['pastbans']) && $settings['pastbans']) {
		?>
					<span>
						<span class="glyphicon glyphicon-globe"></span>
						<?php echo $language['past_player_bans']; ?>
					</span>
					<div class="list-group pastbans">
					<?php
					$i = 0;
					foreach($settings['servers'] as $server) {
						list($pastBans) = cache("SELECT COUNT(*) FROM ".$server['playerBanRecordsTable'], $settings['cache_home'], '', $server, $server['name'].'pastBanStats');

						echo '
						<a class="list-group-item" href="index.php?action=searchplayer&server='.$i.'&player=%25">
							<span class="badge">'.$pastBans.'</span>
							'.$server['name'] .'
						</a>';
						++$i;
					}
					?>
					</div>
		<?php
			}
		?>
				</div>
			</div>
		</div>
	</div>
</div>
<?php
if(count($settings['servers']) > 1) {
	if((isset($settings['latest_bans']) && $settings['latest_bans']) || !isset($settings['latest_bans'])) {
?>
<h2>Latest Bans</h2>
<?php
		if(!empty($settings['servers'])) {
			echo '
	<div class="row">';
			$id = array_keys($settings['servers']);
			$i = 0;
			foreach($settings['servers'] as $server) {
				echo '
		<div class="col-lg-4">
			<h3>'.$server['name'].'</h3>
			<ul class="nav nav-tabs nav-stacked">';
				latestBans($server, $i, $settings['widget_bans_count']);
				echo '
			</ul>
		</div>';

				++$i;
			}
			echo '
	</div>';
		} else
			echo '<span class="label label-info">No Records</span>';
}

	if((isset($settings['latest_mutes']) && $settings['latest_mutes'])) {
?>
<br />
<h2>Latest Mutes</h2>
<?php
		if(!empty($settings['servers'])) {
			echo '
	<div class="row">';
			$id = array_keys($settings['servers']);
			$i = 0;
			foreach($settings['servers'] as $server) {
				echo '
		<div class="col-lg-4">
			<h3>'.$server['name'].'</h3>
			<ul class="nav nav-tabs nav-stacked">';
				latestMutes($server, $i, $settings['widget_mutes_count']);
				echo '
			</ul>
		</div>';

				++$i;
			}
			echo '
	</div>';
		} else
			echo '<span class="label label-info">No Records</span>';
}

	if((isset($settings['latest_warnings']) && $settings['latest_warnings'])) {
?>
<br />
<h2>Latest warnings</h2>
<?php
		if(!empty($settings['servers'])) {
			echo '
	<div class="row">';
			$id = array_keys($settings['servers']);
			$i = 0;
			foreach($settings['servers'] as $server) {
				echo '
		<div class="col-lg-4">
			<h3>'.$server['name'].'</h3>
			<ul class="nav nav-tabs nav-stacked">';
				latestWarnings($server, $i, $settings['widget_warnings_count']);
				echo '
			</ul>
		</div>';

				++$i;
			}
			echo '
	</div>';
		} else
			echo '<span class="label label-info">No Records</span>';
	}
} else if(count($settings['servers']) == 1) {
	$display = false;

	if((isset($settings['latest_bans']) && $settings['latest_bans']) || !isset($settings['latest_bans']))
		$display = true;
	if((isset($settings['latest_mutes']) && $settings['latest_mutes']))
		$display = true;
	if((isset($settings['latest_warnings']) && $settings['latest_warnings']))
		$display = true;

	if($display) {
		$server = $settings['servers'][0];
		echo '
		<h1>'.$server['name'].'</h1>
		<div class="row">';

		if((isset($settings['latest_bans']) && $settings['latest_bans']) || !isset($settings['latest_bans'])) {
			echo '
			<div class="col-lg-4">
				<h3>'.$language['latest_bans_title'].'</h3>
				<ul class="nav nav-tabs nav-stacked">';
					latestBans($server, 0);
				echo '
				</ul>
			</div>';
		}

		if((isset($settings['latest_mutes']) && $settings['latest_mutes'])) {
			echo '
			<div class="col-lg-4">
				<h3>'.$language['latest_mutes_title'].'</h3>
				<ul class="nav nav-tabs nav-stacked">';
					latestMutes($server, 0);
					echo '
				</ul>
			</div>';
		}

		if((isset($settings['latest_warnings']) && $settings['latest_warnings'])) {
			echo '
			<div class="col-lg-4">
				<h3>'.$language['latest_warnings_title'].'</h3>
				<ul class="nav nav-tabs nav-stacked">';
					latestWarnings($server, 0);
				echo '
				</ul>
			</div>';
		}

		echo '
		</div>';
	}
}
?>
