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

				<?php if(isset($_GET['action'])): ?>
					<div class="alert alert-box alert-danger">
						<strong>Oh no! That failed!</strong>
						<p>Check if you have set up everything correctly and try again.</p>
					</div>
				<?php endif; ?>

				<div style="margin: 40px 0 40px 0">
					<p>It seems like you did not yet setup the WebUI. Let's get started with that right now.</p>

					<h3>Preperation</h3>
					<ol>
						<li>Make sure the <kbd>cache</kbd> directory is writeable and readable.</li>
						<li>Rename the <kbd>settingsRename.php</kbd> file to <kbd>settings.php</kbd>.</li>
						<li>Make sure the <kbd>settings.php</kbd> file is writeable and readable.</li>
						<li>Open your <kbd>settings.php</kbd> with an editor (such as Notepad++) and adjust the settings. Make sure to set a strong password!</li>
					</ol>

					<p style="margin-top: 60px"><a href="index.php?action=admin" class="btn btn-primary"><i class="glyphicon glyphicon-check"></i> Let's go!</a></p>
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
	</footer>
</body>
</html>