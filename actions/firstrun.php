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

$path = $_SERVER['HTTP_HOST'].str_replace('index.php', '', $_SERVER['SCRIPT_NAME']);

?>

<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<title>BanManager-WebUI</title>
	<link rel="stylesheet" type="text/css" href="assets/css/style.css" media="screen" />
</head>

<body>
	<div class="container">
		<div class="row">
			<div class="col-lg-12">
				<h1>Welcome!</h1>
				<p class="lead">Thanks for using the BanManager-WebUI.</p>
				<hr />

				<?php if(isset($_GET['action'])) { ?>
					<div class="alert alert-box alert-warning">
						<strong>Oh no! That failed!</strong>
						<p>Check if you have set up everything correctly and try again.</p>
					</div>
				<?php } ?>

				<div>
					<p>It seems like you did not yet setup the WebUI. Let's get started with that right now.</p>

					<h3>Preperation</h3>
					<ul id="check-list-box" class="list-group checked-list-box">
						<li class="list-group-item" data-state="success">Make sure the <kbd>cache</kbd> directory is writeable and readable.</li>
						<li class="list-group-item" data-state="failed">Rename the <kbd>settingsRename.php</kbd> file to <kbd>settings.php</kbd>.</li>
						<li class="list-group-item">Make sure the <kbd>settings.php</kbd> file is writeable and readable.</li>
						<li class="list-group-item">Open your <kbd>settings.php</kbd> with an editor (such as Notepad++) and adjust the settings. Make sure to set a strong password!</li>
					</ul>
					<p><a href="/" class="btn btn-primary"><i class="glyphicon glyphicon-check"></i> Let's go!</a></p>
				</div>
			</div>
		</div>
	</div>

	<footer>
		<div class="container">
			<div class="row">
				<div class="col-lg-12">
					<hr />
					<p class="pull-left">&copy by <a href="https://github.com/BanManagement/BanManager-WebUI" target="_blank">BanManager-WebUI</a></p>
					<p class="pull-right">Created By <a href="http://www.frostcast.net" target="_blank">
						<img src="assets/images/brand.png" alt="Frostcast" id="copyright_image" />
					</a></p>
				</div>
			</div>
		</div>
		<script src="//<?php echo $path; ?>assets/js/build.js"></script>
	</footer>
</body>
</html>
