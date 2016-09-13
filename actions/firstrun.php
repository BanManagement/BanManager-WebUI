<?php

$path = $_SERVER['HTTP_HOST'].str_replace('index.php', '', $_SERVER['SCRIPT_NAME']);

function checkCache(){
	if (!is_writeable(IN_PATH.'cache/')) {
		return false;
	}
	return true;
}

function checkSettingsFileExistance(){
	if (!file_exists(IN_PATH.'settings.php')) {
		return false;
	}
	return true;
}

function checkSettingsFileWriteable(){
	if (!is_writable(IN_PATH.'settings.php')) {
		return false;
	}
	return true;
}

function checkWeakPassword(){
	if (checkSettingsFileExistance()){
		include(IN_PATH.'settings.php');
		if ($settings['password'] == 'password') {
			return false;
		}
	}
	return true;
}

if (!checkCache() || !checkSettingsFileExistance() || !checkSettingsFileWriteable() || !checkWeakPassword()) {
	$failed = true;
}

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

				<?php if(@$failed) { ?>
					<div class="alert alert-box alert-warning">
						<strong>Oh no, the check failed!</strong>
						<p>Check if you have set up everything correctly and try again.</p>
					</div>
				<?php } ?>

				<div>
					<p>It seems like you did not yet setup the WebUI. Let's get started with that right now.</p>

					<h3>Preperation / checklist</h3>
					<ul id="check-list-box" class="list-group checked-list-box">
						<li class="list-group-item list-group-item-<?= (checkCache()) ? 'success' : 'danger' ?>">Make sure the <kbd>cache</kbd> directory is writeable and readable.</li>
						<li class="list-group-item list-group-item-<?= (checkSettingsFileExistance()) ? 'success' : 'danger' ?>">Rename the <kbd>settingsRename.php</kbd> file to <kbd>settings.php</kbd>.</li>
						<li class="list-group-item list-group-item-<?= (checkSettingsFileWriteable()) ? 'success' : 'danger' ?>">Make sure the <kbd>settings.php</kbd> file is writeable and readable.</li>
						<li class="list-group-item list-group-item-<?= (checkWeakPassword()) ? 'success' : 'danger' ?>">Open your <kbd>settings.php</kbd> with an editor (such as Notepad++) and adjust the settings. Make sure to set a strong password!</li>
					</ul>
					<a href="index.php?action=firstrun" class="btn btn-default"><i class="glyphicon glyphicon-check"></i> Run check</a>
					<?php if(!@$failed && isset($_GET['action'])) { ?>
						<a href="/" class="btn btn-primary"><i class="glyphicon glyphicon-arrow-left"></i> Back to WebUI</a>
					<?php } ?>
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

<?php exit(); ?>
