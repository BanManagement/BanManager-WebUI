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
else if(!isset($_GET['player']) || empty($_GET['player']))
	redirect('index.php');
else {

	$pastbans = true;
	if(isset($_GET['excluderecords'])){
		$pastbans = false;
	}

	// Get the server details
	$server = $settings['servers'][$_GET['server']];

	// Clear old search cache's
	clearCache($_GET['server'].'/search', 300);
	clearCache($_GET['server'].'/mysqlTime', 300);

	$search = $_GET['player'];
	$page = 0;
	$size = 10;
	$sortByCol = 0;
	$sortBy = 'ASC';
	$filter = '';
	$filterCol = 0;

	$timeDiff = cache('SELECT ('.time().' - UNIX_TIMESTAMP(now()))/3600 AS mysqlTime', 5, $_GET['server'].'/mysqlTime', $server); // Cache it for a few seconds

	$mysqlTime = $timeDiff['mysqlTime'];
	$mysqlTime = ($mysqlTime > 0)  ? floor($mysqlTime) : ceil ($mysqlTime);
	$mysqlSecs = ($mysqlTime * 60) * 60;

	if(isset($_GET['ajax'])) {

		if(isset($_GET['page']) && is_numeric($_GET['page']))
			$page = $_GET['page'];
		if(isset($_GET['size']) && is_numeric($_GET['size']))
			$size = $_GET['size'];
		if(isset($_GET['filter']) && $_GET['filter'] != 'filter') {
			preg_match('/filter\[([0-9])\]=([a-z0-9]*)/', $_GET['filter'], $filters);
			if(!empty($filters)) {
				if(isset($filters[1]) && is_numeric($filters[1]))
					$filterCol = $filters[1];
				if(isset($filters[2]) && is_alphanum($filters[2]))
					$filter = $filters[2];
			}
		}
		if(isset($_GET['sortby'])) {
			preg_match('/column\[([0-9])\]=([0-9])/', $_GET['sortby'], $orders);
			if(!empty($orders)) {
				if(isset($orders[1]) && is_numeric($orders[1]))
					$sortByCol = $orders[1];
				if(isset($orders[2]) && is_numeric($orders[2]))
					$sortBy = ($orders[2] == 0 ? 'ASC' : 'DESC');
			}
		}
		$found = searchPlayers($search, $_GET['server'], $server, $sortByCol, $sortBy, $pastbans, true);

		$total = count($found);
		$timeNow = time();

		if(is_array($found)) {
			$playerNames = array_keys($found);

			$ajaxArray = array();
			$ajaxArray['total_rows'] = $total;

			$start = $page * $size;
			$end = $start + $size;

			if(!empty($filter)) {
				$start = 0;
				$end = $total;
			}

			for($i = $start; $i < $end; ++$i) {
				if(!isset($playerNames[$i]))
					break;

				$player = $found[$playerNames[$i]];
				$playerName = $player['name'];
				$expireTime = ($player['expires'] + $mysqlSecs)- $timeNow;

				if($player['type'] != 'Kick' && $player['type'] != 'Warning') {
					if($player['expires'] == 0)
						$expires = '<span class="label label-danger">Permanent</span>';
					else if(isset($expireTime) && $expireTime > 0) {
						$expires = '<span class="label label-warning">'.secs_to_hmini($expireTime).'</span>';
					} else
						$expires = '<span class="label label-warning">Expired</span>';
				} else {
					$expires = '';
				}

				if(!empty($filter)) {
					$skip = false;
					switch($filterCol) {
						case 0:
							if(stripos($playerName, $filter) === false)
								$skip = true;
						break;
						case 1:
							if(stripos($player['type'], $filter) === false)
								$skip = true;
						break;
						case 2:
							if(stripos($player['by'], $filter) === false)
								$skip = true;
						break;
						case 3:
							if(stripos($player['reason'], $filter) === false)
								$skip = true;
						break;
						case 4:
							if(stripos($expires, $filter) === false)
								$skip = true;
						break;
						case 5:
							$time = (!empty($player['time']) ? date($language['searchplayer']['date-format'], $player['time']) : '');
							if(stripos($time, $filter) === false)
								$skip = true;
						break;
					}

					if($skip)
						continue;
				}

				if(!isset($time)) $time = (!empty($player['time']) ? date($language['searchplayer']['date-format'], $player['time']) : '');

				$ajaxArray['rows'][] = array(
					'<img src="'.str_replace(array('%name%', '%uuid%'), array($playerName, $player['uuid']), $settings['skin']['helm']).'" class="skin-helm" /> <a href="index.php?action=viewplayer&player='.$playerName.'&server='.$_GET['server'].'">'.$playerName.'</a>',
					$player['type'],
					$player['by'],
					$player['reason'],
					$expires,
					$time
				);
				unset($time);
			}

			if(!empty($filter) && isset($ajaxArray['rows'])) {
				$ajaxArray['total_rows'] = count($ajaxArray['rows']);
				$start = $page * $size;

				if($ajaxArray['total_rows'] >= $start) {
					$ajaxArray['rows'] = array_slice($ajaxArray['rows'], $start, $size);
				}
			}
		} else {
			$total = 1;
		}

		if(!is_array($found) || !isset($ajaxArray['rows'])) {
			$ajaxArray = array('total_rows' => 1, 'rows' => array(array('None Found', '', '', '', '', '')));
		}

			// print(json_encode(count($found)));
			// print(json_encode($found));

		die(json_encode($ajaxArray));
	}

	$found = searchPlayers($search, $_GET['server'], $server, $sortByCol, $sortBy, $pastbans);

	if(!$found) {
		errors('No matched players found');
		?><a href="index.php" class="btn btn-primary"><?= $language['searchplayer']['new_search']; ?></a><?php
	} else {
		?>
	<form class="form-inline" action="" method="get">
		<fieldset>
			<div class="page-header">
				<h1><?= $language['searchplayer']['header']; ?></h1>
			</div>
			<input type="hidden" name="action" value="searchplayer" />
			<input type="hidden" name="server" value="<?php echo $_GET['server']; ?>" />
			<input type="hidden" name="player" value="<?php echo $_GET['player']; ?>" />
		</fieldset>
	</form>
	<table class="table table-striped table-bordered sortable">
		<thead>
			<tr>
				<th><?= $language['searchplayer']['player_name']; ?></th>
				<th><?= $language['searchplayer']['type']; ?></th>
				<th><?= $language['searchplayer']['by']; ?></th>
				<th><?= $language['searchplayer']['reason']; ?></th>
				<th><?= $language['searchplayer']['expires']; ?></th>
				<th><?= $language['searchplayer']['date']; ?></th>
			</tr>
		</thead>
		<tbody>
		</tbody>
		<tfoot>
			<tr>
				<th colspan="7" class="pager form-horizontal">
					<button class="btn btn-default first"><span class="glyphicon glyphicon-step-backward"></span></button>
					<button class="btn btn-default prev"><span class="glyphicon glyphicon-arrow-left"></span></button>
					<span class="pagedisplay"></span>
					<button class="btn btn-default next"><span class="glyphicon glyphicon-arrow-right" style="float:none"></span></button>
					<button class="btn btn-default last"><span class="glyphicon glyphicon-step-forward"></span></button>
					<select class="pagesize input-mini" title="<?= $language['searchplayer']['input-title-page_size']; ?>">
						<option selected="selected" value="10">10</option>
						<option value="20">20</option>
						<option value="30">30</option>
						<option value="40">40</option>
					</select>
					<select class="pagenum input-mini" title="<?= $language['searchplayer']['input-title-page_number']; ?>"></select>
				</th>
			</tr>
		</tfoot>
	</table>
		<?php
	}
}
?>
