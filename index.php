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

session_name("BanManagement");
session_start();
ob_start();

if(!isset($_SESSION['initiated'])) {
		session_regenerate_id();
		$_SESSION['initiated'] = true;
}

define('IN_PATH', realpath('.') . '/'); // This allows us to use absolute urls

/**
 * Snippet from php.net by bohwaz
 * below function kills register globals
 * to remove any possible security threats if it is on
 */
if(ini_get('register_globals')) {
	function unregister_globals() {
		foreach(func_get_args() as $name) {
			foreach($GLOBALS[$name] as $key => $value) {
				if(isset($GLOBALS[$key]))
					unset($GLOBALS[$key]);
			}
		}
	}
	unregister_globals('_POST', '_GET', '_COOKIE', '_REQUEST', '_SERVER', '_ENV', '_FILES', '_SESSION');
}

// REQUEST_URI fix for hosts using IIS (Windows)
if(!isset($_SERVER['REQUEST_URI'])) {
	$_SERVER['REQUEST_URI'] = $_SERVER['SCRIPT_NAME'];
	if($_SERVER['QUERY_STRING']) {
		$_SERVER['REQUEST_URI'] .= '?' . $_SERVER['QUERY_STRING'];
	}
}

// mysql_real_escape_string that doesn't require an active database connection
function mysql_escape_mimic($inp) {
		if(is_array($inp))
				return array_map(__METHOD__, $inp);

		if(!empty($inp) && is_string($inp))
				return str_replace(array('\\', "\0", "\n", "\r", "'", '"', "\x1a"), array('\\\\', '\\0', '\\n', '\\r', "\\'", '\\"', '\\Z'), $inp);

		return $inp;
}

/**
 * Encodes HTML within below globals, takes into account magic quotes.
 * Note: $_SERVER is not sanitised, be aware of this when using it.
 * Why repeat it twice? Checking magic quotes everytime in a loop is slow and so is any additional if statements ;)
 */
$in = array(&$_GET, &$_POST);
if(get_magic_quotes_gpc()) {
	while(list($k, $v) = each($in)) {
		foreach($v as $key => $val) {
			if(!is_array($val))
				$in[$k][mysql_escape_mimic(htmlspecialchars(stripslashes($key), ENT_QUOTES))] = mysql_escape_mimic(htmlspecialchars(stripslashes($val), ENT_QUOTES));
			else
				$in[] =& $in[$k][$key];
		}
	}
} else {
	while(list($k, $v) = each($in)) {
		foreach($v as $key => $val) {
			if(!is_array($val))
				$in[$k][mysql_escape_mimic(htmlspecialchars($key, ENT_QUOTES))] = mysql_escape_mimic(htmlspecialchars($val, ENT_QUOTES));
			else
				$in[] =& $in[$k][$key];
		}
	}
}

if(!function_exists('json_encode')) {
	function json_encode($a = false) {
		/**
			* This function encodes a PHP array into JSON
		* Function from php.net by Steve
			* Returns: @JSON
			*/
			if(is_null($a))
			return 'null';
			if($a === false)
			return 'false';
			if($a === true)
			return 'true';
		if(is_scalar($a)) {
			if(is_float($a))
				return floatval(str_replace(",", ".", strval($a))); // Always use "." for floats.
					if(is_string($a)) {
				static $jsonReplaces = array(array("\\", "/", "\n", "\t", "\r", "\b", "\f", '"'), array('\\\\', '\\/', '\\n', '\\t', '\\r', '\\b', '\\f', '\"'));
				return '"' . str_replace($jsonReplaces[0], $jsonReplaces[1], $a) . '"';
			} else
				return $a;
		}
		$isList = true;
		for($i = 0, reset($a); $i < count($a); $i++, next($a)) {
			if(key($a) !== $i) {
				$isList = false;
				break;
			}
		}
		$result = array();
		if($isList) {
			foreach ($a as $v)
				$result[] = json_encode($v);
			return '[' . join(',', $result) . ']';
		} else {
			foreach ($a as $k => $v)
				$result[] = json_encode($k).':'.json_encode($v);
			return '{' . join(',', $result) . '}';
		}
	}
}

$apc_status = extension_loaded('apc') && ini_get('apc.enabled');
if($apc_status) {
	if(!function_exists('apc_exists')) {
		if(version_compare(phpversion('apc'), '3.1.4', '<')) {
			function apc_exists($key) {
				return (bool) apc_fetch($key);
			}
		}
	}
}

function redirect($location, $code = '302') {
	switch($code) {
		case '301';
			header("HTTP/1.1 301 Moved Permanently");
		break;
		case '303';
			header("HTTP/1.1 303 See Other");
		break;
		case '404';
			header('HTTP/1.1 404 Not Found');
		break;
	}
	//remove any &amp; in the url to prevent any problems
	$location = str_replace('&amp;', '&', $location);
	header("Location: $location");
	//kill the script from running and output a link for browsers which enable turning off header redirects *cough Opera cough* :P
	exit('<a href="'.$location.'">If you were not redirected automatically please click here</a>');
}

function returnVersion(){
	global $settings;
	if (file_exists(".git")) {
		$gitref = shell_exec("git log -1 --pretty=format:'%h' --abbrev-commit");
		if ($gitref) {
			return "GIT-".$gitref;
		}
	}	else {
		$version = file_get_contents('./VERSION');
		if ($version) {
			return trim($version);
		}
	}
}

function errors($message) {
	echo '
		<div class="container">
		<div id="error" class="alert alert-danger">
			<button class="close" data-dismiss="alert">&times;</button>
			<h1>Uh oh, we\'ve found an error.</h1>';
	if(is_array($message)) {
		foreach($message as $e)
			echo $e;
	} else {
		echo $message;
	}
		echo '</div></div>';
}
/*
 * Convert seconds to human readable text.
 * http://csl.sublevel3.org/php-secs-to-human-text/
 */
function secs_to_h($secs) {
	global $language;

	$units = array(
		$language['general']['datetime']['week']   => 7*24*3600,
		$language['general']['datetime']['day']    =>   24*3600,
		$language['general']['datetime']['hour']   =>      3600,
		$language['general']['datetime']['minute'] =>        60,
		$language['general']['datetime']['second'] =>         1,
	);

	// specifically handle zero
	if ( $secs == 0 )
		return "0 seconds";
	$s = '';
	foreach ( $units as $name => $divisor ) {
		if ( $quot = intval($secs / $divisor) ) {
			$s .= "$quot $name";
			$s .= (abs($quot) > 1 ? "s" : "") . ", ";
			$secs -= $quot * $divisor;
		}
	}
	return substr($s, 0, -2);
}

function secs_to_hmini($secs) {
	$units = array(
		"w"   => 7*24*3600,
		"d"    =>   24*3600,
		"h"   =>      3600,
		"m" =>        60,
		"s" =>         1,
	);

	// specifically handle zero
	if ( $secs == 0 )
		return "0s";
	$s = '';
	foreach ( $units as $name => $divisor ) {
		if ( $quot = intval($secs / $divisor) ) {
			if($quot > 0) {
				$s .= $quot.$name;
				$s .= (abs($quot) > 1 && $name == 's' ? 's' : ''). ' ';
			}
			$secs -= $quot * $divisor;
		}
	}
	return substr($s, 0, -2);
}

function is_alphanum($string) {
	if(function_exists('ctype_alnum'))
		return ctype_alnum($string);
	else
		return (preg_match("~^[a-z0-9]*$~iD", $string) !== 0 ? true : false);
}

function is_alphanumdash($string) {
	return (preg_match("~^[a-z0-9_-]*$~iD", $string) !== 0 ? true : false);
}

function cache($query, $time, $folder = '', $server = array(), $name = '', $assoc = false) {
	global $settings;
	$md5 = md5($query);
	if($folder == '' && empty($name))
		$file = $md5;
	else if($folder != '' && empty($name))
		$file = $folder.'/'.$md5;
	else if($folder != '' && !empty($name))
		$file = $folder.'/'.$name;
	else if($folder == '' && !empty($name))
		$file = $name;

	if ($settings['debug']['sqlcache'] == true) {
		echo "<pre>";
		echo substr($query, 0, 1000);
		echo "</pre>";
	}

	if($settings['apc_enabled']) {
		if(apc_exists($file))
			return apc_fetch($file);
		else {
			return createCache($query, $server, $file, $time, $assoc);
		}
	} else {
		$file = IN_PATH.'cache/'.$file.'.php';
		if($folder != '' && !is_dir(IN_PATH.'cache/'.$folder))
			mkdir(IN_PATH.'cache/'.$folder, 0777, true);
		if(file_exists($file)) {
			if(time() - filemtime($file) > $time) {
				// Needs recache
				return createCache($query, $server, $file, 0, $assoc); // Return the fresh data
			} else {
				// Serve the cache
				return unserialize(file_get_contents($file, NULL, NULL, 16));
			}
		} else {
			// Cache needs creating
			return createCache($query, $server, $file, 0, $assoc); // Return the fresh data
		}
	}
}

function createCache($query, $server, $file, $time = 0, $assoc) {
	global $settings;

	// if(!empty($server)) {
	// 	if(isset($settings['last_connection'])) {
	// 		$diff = array_diff($settings['last_connection'], $server);
	// 		if(!empty($diff)) {
	// 			$mysqlicon = connect($server);
	// 		}
	// 	} else {
			$mysqlicon = connect($server);
	// 	}
	// }
	$result = mysqli_query($mysqlicon, $query);

	if (mysqli_error($mysqlicon)) {
		errors(mysqli_error($mysqlicon));
	}

	$data = array();

	if (!is_a($result, 'mysqli_result')) {
		return false;
	}

	if(mysqli_num_rows($result) > 0) {
		if ($assoc) {
			while($row = mysqli_fetch_assoc($result)){
				array_push($data, $row);
			}
		} else {
			while($row = mysqli_fetch_array($result)){
				array_push($data, $row);
			}
		}
	}

	// Check if its only one row
	if(count($data) == 1) {
		$data = $data[0];
	}

	// Now save it
	if(!$settings['apc_enabled']){
		file_put_contents($file, "<?php die(); ?>\n".serialize($data)); // Create the file
	}	else {
		apc_store($file, $data, $time);
	}

	mysqli_close($mysqlicon);

	return $data; // Return the fresh data
}

function rglob($pattern='*', $flags = 0, $path='') {
		$paths = glob($path.'*', GLOB_MARK|GLOB_ONLYDIR|GLOB_NOSORT);
		$files = glob($path.$pattern, $flags);
	if($path !== false && $files !== false) {
		foreach($paths as $path)
			$files = array_merge($files, rglob($pattern, $flags, $path));
	} else
		$files = array();
		return $files;
}

function clearCache($folder = '', $olderThan = 0) {
	global $settings;

	if($settings['apc_enabled']) {
		apc_delete($folder);
		return;
	}

	$timeNow = time();
	if(empty($folder))
		$files = rglob('*.php', null, IN_PATH.'cache');
	else
		$files = rglob('*.php', null, IN_PATH.'cache/'.$folder);
	foreach($files as $file) {
		if($olderThan == 0)
			unlink($file);
		else if($timeNow - filemtime($file) > $olderThan) {
			unlink($file);
		}
	}
}

function playerNameToUUID($name, $server) {
	global $settings;
	$result = cache("SELECT HEX(id) as id FROM ".$server['playersTable']." WHERE name = '$name'", $settings['cache_playertouuid'], 'playerNameToUUID', $server);
	if(isset($result[0]))
		return $result['id'];
	else
		return null;
}

function connect($server) {
	global $settings;

	$mysqli = mysqli_connect($server['host'], $server['username'], $server['password'], $server['database'])
		or print("Some error occurred during connection " . mysqli_error($mysqli));

	$settings['last_connection'] = $server;

	if(isset($settings['utf8']) && $settings['utf8']){
		mysqli_query($mysqli, "SET NAMES 'utf8'");
	}

	return $mysqli;
}

function searchPlayers($search, $limit, $offset, $serverID, $server, $sortByCol = 'name', $sortBy = 'ASC', $past = true, $isAjax = false) {
	global $language, $settings;

	switch($sortByCol) {
		default:
		case 0: // Name
			$sort['bans'] = $sort['banrecords'] = 'player_id';
			$sort['mutes'] = $sort['muterecords'] = 'player_id';
			$sort['kicks'] = 'player_id';
			$sort['warnings'] = 'player_id';
		break;
		case 1: // Type
			$sort['bans'] = $sort['banrecords'] = 'player_id';
			$sort['mutes'] = $sort['muterecords'] = 'player_id';
			$sort['kicks'] = 'player_id';
			$sort['warnings'] = 'player_id';
		break;
		case 2: // By
			$sort['bans'] = $sort['banrecords'] = 'actor_id';
			$sort['mutes'] = $sort['muterecords'] = 'actor_id';
			$sort['kicks'] = 'actor_id';
			$sort['warnings'] = 'actor_id';
		break;
		case 3: // Reason
			$sort['bans'] = $sort['banrecords'] = 'reason';
			$sort['mutes'] = $sort['muterecords'] = 'reason';
			$sort['kicks'] = 'reason';
			$sort['warnings'] = 'reason';
		break;
		case 4: // Expires
			$sort['bans'] = 'expires';
			$sort['banrecords'] = 'expired';
			$sort['mutes'] = 'expires';
			$sort['muterecords'] = 'expired';
			$sort['kicks'] = 'b.id';
			$sort['warnings'] = 'expires';
		break;
		case 5: // Date
			$sort['bans'] = $sort['banrecords'] = 'created';
			$sort['mutes'] = $sort['muterecords'] = 'created';
			$sort['kicks'] = 'created';
			$sort['warnings'] = 'created';
		break;
	}

	$query = array();

	if((isset($settings['player_current_ban']) && $settings['player_current_ban']) || !isset($settings['player_current_ban'])) {
		$sql = "SELECT * FROM
	  ( SELECT 'Ban' type, HEX(p.id) AS player_id, p.name AS name, HEX(a.id) AS actor_id, a.name AS actor, created, expires, reason
	    FROM ".$server['playerBansTable']."
	    LEFT JOIN ".$server['playersTable']." p ON player_id = p.id
	    LEFT JOIN ".$server['playersTable']." a ON actor_id = a.id";

		if ($search !== '%') $sql .= " WHERE p.name LIKE '$search%'";
		$sql .= "
	    ORDER BY ".$sort['bans']." $sortBy
	    LIMIT $offset, $limit
	  ) AS b";

		array_push($query, $sql);
	}

	if((isset($settings['player_current_mute']) && $settings['player_current_mute']) || !isset($settings['player_current_mute'])) {
		$sql = "SELECT * FROM
	  ( SELECT 'Mute' type, HEX(p.id) AS player_id, p.name AS name, HEX(a.id) AS actor_id, a.name AS actor, created, expires, reason
	    FROM ".$server['playerMutesTable']."
	    LEFT JOIN ".$server['playersTable']." p ON player_id = p.id
	    LEFT JOIN ".$server['playersTable']." a ON actor_id = a.id";

		if ($search !== '%') $sql .= " WHERE p.name LIKE '$search%'";
		$sql .= "
	    ORDER BY ".$sort['mutes']." $sortBy
	    LIMIT $offset, $limit
	  ) AS m";

		array_push($query, $sql);
	}

	if($past) {
		if(((isset($settings['player_previous_bans']) && $settings['player_previous_bans']) || !isset($settings['player_previous_bans'])) && $past) {
			$sql = "SELECT * FROM
		  ( SELECT 'Ban' type, HEX(p.id) AS player_id, p.name AS name, HEX(a.id) AS actor_id, a.name AS actor, created, expired AS expires, reason
		    FROM ".$server['playerBanRecordsTable']."
		    LEFT JOIN ".$server['playersTable']." p ON player_id = p.id
		    LEFT JOIN ".$server['playersTable']." a ON actor_id = a.id";

			if ($search !== '%') $sql .= " WHERE p.name LIKE '$search%'";
			$sql .= "
		    ORDER BY ".$sort['banrecords']." $sortBy
		    LIMIT $offset, $limit
		  ) AS br";

			array_push($query, $sql);
		}

		if((isset($settings['player_previous_mutes']) && $settings['player_previous_mutes']) || !isset($settings['player_previous_mutes'])) {
			$sql = "SELECT * FROM
		  ( SELECT 'Mute' type, HEX(p.id) AS player_id, p.name AS name, HEX(a.id) AS actor_id, a.name AS actor, created, expired AS expires, reason
		    FROM ".$server['playerMuteRecordsTable']."
		    LEFT JOIN ".$server['playersTable']." p ON player_id = p.id
		    LEFT JOIN ".$server['playersTable']." a ON actor_id = a.id";

			if ($search !== '%') $sql .= " WHERE p.name LIKE '$search%'";
			$sql .= "
		    ORDER BY ".$sort['muterecords']." $sortBy
		    LIMIT $offset, $limit
		  ) AS mr";

			array_push($query, $sql);
		}

		if((isset($settings['player_kicks']) && $settings['player_kicks']) || !isset($settings['player_kicks'])) {
			$sql = "SELECT * FROM
		  ( SELECT 'Kick' type, HEX(p.id) AS player_id, p.name AS name, HEX(a.id) AS actor_id, a.name AS actor, created, '0' expires, reason
		    FROM ".$server['playerKicksTable']."
		    LEFT JOIN ".$server['playersTable']." p ON player_id = p.id
		    LEFT JOIN ".$server['playersTable']." a ON actor_id = a.id";

			if ($search !== '%') $sql .= " WHERE p.name LIKE '$search%'";
			$sql .= "
		    ORDER BY ".$sort['kicks']." $sortBy
		    LIMIT $offset, $limit
		  ) AS k";

			array_push($query, $sql);
		}
	}

	if((isset($settings['player_warnings']) && $settings['player_warnings']) || !isset($settings['player_warnings'])) {
		$sql = "SELECT * FROM
		  ( SELECT 'Warning' type, HEX(p.id) AS player_id, p.name AS name, HEX(a.id) AS actor_id, a.name AS actor, created, expires, reason
		    FROM ".$server['playerWarningsTable']."
		    LEFT JOIN ".$server['playersTable']." p ON player_id = p.id
		    LEFT JOIN ".$server['playersTable']." a ON actor_id = a.id";

			if ($search !== '%') $sql .= " WHERE p.name LIKE '$search%'";
			$sql .= "
		    ORDER BY ".$sort['warnings']." $sortBy
		    LIMIT $offset, $limit
		  ) AS w";

			array_push($query, $sql);
	}

	$sql = implode(' UNION ALL ', $query);

	switch($sortByCol) {
		default:
		case 0: // Name
			$sql .= " ORDER BY name $sortBy";
		break;
		case 1: // Type
			$sql .= " ORDER BY type $sortBy";
		break;
		case 2: // By
			$sql .= " ORDER BY actor $sortBy";
		break;
		case 3: // Reason
			$sql .= " ORDER BY reason $sortBy";
		break;
		case 4: // Expires
			$sql .= " ORDER BY expires $sortBy";
		break;
		case 5: // Date
			$sql .= " ORDER BY created $sortBy";
		break;
	}

	$sql .= " LIMIT $limit";
	$found = cache($sql, $settings['cache_search'], $serverID.'/search', $server);

	if(count($found) == 0) {
		return false;
	} else if(count($found) == 1 && !$isAjax) {
		// Redirect!
		$player = reset($found);
		redirect('index.php?action=viewplayer&player='.$player['name'].'&server='.$serverID);
	} else {
		// STUFF
		return $found;
	}
}

function searchPlayersTotal($search, $serverID, $server, $past = true) {
	global $language, $settings;

	$query = array();

	if((isset($settings['player_current_ban']) && $settings['player_current_ban']) || !isset($settings['player_current_ban'])) {
		$sql = "SELECT * FROM
	  ( SELECT COUNT(*)
	    FROM ".$server['playerBansTable']."";

		if ($search !== '%') {
			$sql .= " LEFT JOIN ".$server['playersTable']." p ON player_id = p.id WHERE p.name LIKE '$search%'";
		}
		$sql .= "
	  ) AS b";

		array_push($query, $sql);
	}

	if((isset($settings['player_current_mute']) && $settings['player_current_mute']) || !isset($settings['player_current_mute'])) {
		$sql = "SELECT * FROM
	  ( SELECT COUNT(*)
	    FROM ".$server['playerMutesTable']."";

		if ($search !== '%') {
			$sql .= " LEFT JOIN ".$server['playersTable']." p ON player_id = p.id WHERE p.name LIKE '$search%'";
		}
		$sql .= "
	  ) AS m";

		array_push($query, $sql);
	}

	if($past) {
		if(((isset($settings['player_previous_bans']) && $settings['player_previous_bans']) || !isset($settings['player_previous_bans'])) && $past) {
			$sql = "SELECT * FROM
		  ( SELECT COUNT(*)
		    FROM ".$server['playerBanRecordsTable']."";

			if ($search !== '%') {
				$sql .= " LEFT JOIN ".$server['playersTable']." p ON player_id = p.id WHERE p.name LIKE '$search%'";
			}
			$sql .= "
		  ) AS br";

			array_push($query, $sql);
		}

		if((isset($settings['player_previous_mutes']) && $settings['player_previous_mutes']) || !isset($settings['player_previous_mutes'])) {
			$sql = "SELECT * FROM
		  ( SELECT COUNT(*)
		    FROM ".$server['playerMuteRecordsTable']."";

			if ($search !== '%') {
				$sql .= " LEFT JOIN ".$server['playersTable']." p ON player_id = p.id WHERE p.name LIKE '$search%'";
			}
			$sql .= "
		  ) AS mr";

			array_push($query, $sql);
		}

		if((isset($settings['player_kicks']) && $settings['player_kicks']) || !isset($settings['player_kicks'])) {
			$sql = "SELECT * FROM
		  ( SELECT COUNT(*)
		    FROM ".$server['playerKicksTable']."";

			if ($search !== '%') {
				$sql .= " LEFT JOIN ".$server['playersTable']." p ON player_id = p.id WHERE p.name LIKE '$search%'";
			}
			$sql .= "
		  ) AS k";

			array_push($query, $sql);
		}
	}

	if((isset($settings['player_warnings']) && $settings['player_warnings']) || !isset($settings['player_warnings'])) {
		$sql = "SELECT * FROM
		  ( SELECT COUNT(*)
		    FROM ".$server['playerWarningsTable']."";

			if ($search !== '%') {
				$sql .= " LEFT JOIN ".$server['playersTable']." p ON player_id = p.id WHERE p.name LIKE '$search%'";
			}
			$sql .= "
		  ) AS w";

			array_push($query, $sql);
	}

	$sql = implode(' UNION ALL ', $query);
	$counts = cache($sql, $settings['cache_search'], $serverID.'/totalsearch', $server);

	$total = 0;

	foreach ($counts as $count) {
		$total += $count[0];
	}

	return $total;
}

/* (credits to Lohoris - http://stackoverflow.com/a/2699110) */
function aasort (&$array, $key, $desc) {
		$sorter=array();
		$ret=array();
		reset($array);
		foreach ($array as $ii => $va) {
				$sorter[$ii]=$va[$key];
		}
		if ($desc == "DESC") {
			arsort($sorter);
		} else {
			asort($sorter);
		}
		foreach ($sorter as $ii => $va) {
				$ret[$ii]=$array[$ii];
		}
		$array=$ret;
}

// Function to complete an IP address.
// if $position == "start" { 192.168 => 192.168.0.0 }
// if $position == "end" { 192.168 => 192.168.255.255 }
function completeIPaddress($ip, $position) {
	$ipOctets = explode(".", $ip);

	if ($position == "start") {
		$suffix = "0";
	} elseif ($position == "end") {
		$suffix = "255";
	}

	if (count($ipOctets) == 4) {
		return $ip;
	} elseif (count($ipOctets) == 3) {
		return sprintf("%s.%s.%s.%s", $ipOctets[0], $ipOctets[1], $ipOctets[2], $suffix);
	} elseif (count($ipOctets) == 2) {
		return sprintf("%s.%s.%s.%s", $ipOctets[0], $ipOctets[1], $suffix, $suffix);
	} elseif (count($ipOctets) == 1) {
		return sprintf("%s.%s.%s.%s", $ipOctets[0], $suffix, $suffix, $suffix);
	}
}

function searchIps($search, $serverID, $server, $sortByCol = 'name', $sortBy = 'ASC', $past = true, $isAjax = false) {
	global $language, $settings;
	$found = array();

	switch($sortByCol) {
		default:
		case 0: // Name
			$sort['bans'] = $sort['banrecords'] = 'b.id';
		break;
		case 1: // Type
			$sortByType = true;
			$sort['bans'] = $sort['banrecords'] = 'b.id';
		break;
		case 2: // By
			$sort['bans'] = $sort['banrecords'] = 'actor_id';
		break;
		case 3: // Reason
			$sort['bans'] = $sort['banrecords'] = 'reason';
		break;
		case 4: // Expires
			$sort['bans'] = 'expires';
			$sort['banrecords'] = 'expired';
		break;
		case 5: // Date
			$sort['bans'] = $sort['banrecords'] = 'created';
		break;
	}

	if ($search == "%") {
		$whereStatement = "";
	} else {

		// Check if search contains a "-", aka range search
		if (strpos($search, '-') == true) {
			$searchIPs = explode("-", $search);
			// Make sure we only have two IP elements
			if (count($searchIPs) == 2) {
				$whereStatement = "WHERE b.ip BETWEEN INET_ATON('".completeIPaddress($searchIPs[0], "start")."') AND INET_ATON('".completeIPaddress($searchIPs[1], "end")."')";
			} else {
				return false;
			}
		} else {
			// Check if IP is complete, if not complete and turn into range query
			if ($search != completeIPaddress($search, "start")) {
				$whereStatement = "WHERE b.ip BETWEEN INET_ATON('".completeIPaddress($search, "start")."') AND INET_ATON('".completeIPaddress($search, "end")."')";
			// Otherwise search for exact IP
			} else {
				$whereStatement = "WHERE b.ip = INET_ATON('".$search."')";
			}
		}
	}

	// Found results
	$found = array();

	// Current Bans
	$result = cache("SELECT b.ip, a.name AS actor_name, b.reason, b.created, b.expires FROM ".$server['ipBansTable']." b JOIN ".$server['playersTable']." a ON b.actor_id = a.id ".$whereStatement." ORDER BY ".$sort['bans']." $sortBy", $settings['cache_search'], $serverID.'/search', $server);
	if(isset($result[0]) && !is_array($result[0]) && !empty($result[0]))
		$result = array($result);

	if($result && count($result) > 0) {
		foreach($result as $r) {
			array_push($found, array('ip' => long2ip($r['ip']), 'by' => $r['actor_name'], 'reason' => $r['reason'], 'type' => $language['searchip']['types']['ban'], 'time' => $r['created'], 'expires' => $r['expires']));
		}
	}

	if($past) {
		// Past Bans
		$result = cache("SELECT b.ip, a.name AS actor_name, b.reason, b.created, b.expired FROM ".$server['ipBanRecordsTable']." b JOIN ".$server['playersTable']." a ON b.actor_id = a.id ".$whereStatement." ORDER BY ".$sort['banrecords']." $sortBy", $settings['cache_search'], $serverID.'/search', $server);
		if(isset($result[0]) && !is_array($result[0]) && !empty($result[0]))
			$result = array($result);

		if($result && count($result) > 0) {
			foreach($result as $r) {
				if(!isset($found[long2ip($r['ip'])]))
					array_push($found, array('ip' => long2ip($r['ip']), 'by' => $r['actor_name'], 'reason' => $r['reason'], 'type' => $language['searchip']['types']['ban'], 'time' => $r['created'], 'expires' => $r['expired'], 'past' => true));
				else if($found[long2ip($r['ip'])]['created'] < $r['created'])
					array_push($found, array('ip' => long2ip($r['ip']), 'by' => $r['actor_name'], 'reason' => $r['reason'], 'type' => $language['searchip']['types']['ban'], 'time' => $r['created'], 'expires' => $r['expired'], 'past' => false));
			}
		}
	}

	switch($sortByCol) {
		default:
		case 0: // Name
			aasort($found, "ip", $sortBy);
		break;
		case 1: // Type
			aasort($found, "type", $sortBy);
		break;
		case 2: // By
			aasort($found, "by", $sortBy);
		break;
		case 3: // Reason
			aasort($found, "reason", $sortBy);
		break;
		case 4: // Expires
			aasort($found, "expires", $sortBy);
		break;
		case 5: // Date
			aasort($found, "time", $sortBy);
		break;
	}

	if(count($found) == 0)
		return false;
	else if(count($found) == 1 && !$isAjax) {
		// Redirect!
		$p = array_keys($found);
		redirect('index.php?action=viewip&ip='.$p[0].'&server='.$serverID);
	} else {
		// STUFF
		return $found;
	}
}

function validConsole($id, $server) {
	$mysqlicon = connect($server);

	$id = str_replace('-', '', $id);
	$result = mysqli_query($mysqlicon, "SELECT * FROM " . $server['playersTable'] . " WHERE id = UNHEX('$id')");

	return mysqli_num_rows($result) === 1;
}

$actions = array(
	'admin',
	'deletecache',
	'logout',
	'firstrun',
	'searchplayer',
	'searchip',
	'servers',
	'viewip',
	'viewplayer'
);

$ajaxactions = array(
	'addserver',
	'deleteban',
	'deletebanrecord',
	'deleteipban',
	'deleteipbanrecord',
	'deletekickrecord',
	'deletemute',
	'deletemuterecord',
	'deleteserver',
	'deletewarning',
	'reorderserver',
	'updateban',
	'updateipban',
	'updatemute',
	'updatesettings',
);

if(file_exists('settings.php')){
	include('settings.php');
} else {
	include('actions/firstrun.php');
	exit;
}

// Load localization file
$language = json_decode(file_get_contents(IN_PATH.'l10n/'.$settings['language'].'.json'), true);

// Check neccessary PHP functions
if (isset($settings['debug']['functiontest']) && $settings['debug']['functiontest'] == true) {
	$functions = array(
		'mysqli_connect'
	);

	foreach ($functions as $function) {
		if (!function_exists($function)) {
			echo '<div class="container" id="container"><pre>Caution: '.$function.' doesn\'t exist!</pre></div>'; }
	}
}

if (isset($settings['debug']['error_reporting']) && $settings['debug']['error_reporting'] == true) {
	@ini_set('display_errors', '1');
	error_reporting(1);

	if ($settings['debug']['error_reporting_level']) {
			error_reporting($settings['debug']['error_reporting_level']); // Enable error reports
	}

} else {
	error_reporting(0); // Disable error reports for security
}

// IE8 frame busting, well thats the only good thing it has :P (Now supported by Firefox woot)
if((isset($settings['iframe_protection']) && $settings['iframe_protection']) || !isset($settings['iframe_protection']))
	header('X-FRAME-OPTIONS: SAMEORIGIN');

$settings['servers'] = unserialize($settings['servers']);

// Check if APC is enabled to use that instead of file cache
$settings['apc_enabled'] = $apc_status;

if(!isset($_GET['ajax']) || (isset($_GET['ajax']) && !$_GET['ajax']))
	include('header.php');

if(isset($_GET['action']) && in_array($_GET['action'], $actions))
	include("actions/".$_GET['action'].'.php');
else if(isset($_GET['action']) && in_array($_GET['action'], $ajaxactions))
	include("ajax/".$_GET['action'].'.php');
else if(!isset($_GET['action']))
	include('actions/home.php');
else
	echo 'Action not found, possible hacking attempt';
if(!isset($_GET['ajax']) || (isset($_GET['ajax']) && !$_GET['ajax']))
	include('footer.php');
?>
