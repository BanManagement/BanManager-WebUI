			<hr>
			<footer>
				<p class="pull-left"><?php echo $settings['footer']; ?><?php if(isset($settings['admin_link']) && $settings['admin_link']){echo ' &mdash; <a href="index.php?action=admin" target="_blank" style="color:inherit;"><span class="glyphicon glyphicon-dashboard"></span></a>';} echo ' &mdash; <a href="https://github.com/BanManagement/BanManager-WebUI" target="_blank">BanManager WebUI</a> version '.returnVersion(); ?></p>
			</footer>
		</div> <!-- /container -->

		<script src="//<?php echo $path; ?>assets/js/build.js"></script>

		<?php
			if((isset($settings['iframe_protection']) && $settings['iframe_protection']) || !isset($settings['iframe_protection'])) {
				echo '
					<script type="text/javascript">
						if (top.location != self.location) { top.location = self.location.href; }
					</script>';
			}
			if(isset($_SESSION['admin']) && $_SESSION['admin']) {
				echo '
					<script type="text/javascript">
						var authid = \''.sha1($settings['password']).'\';
					</script>';
			}

			echo '
				<script type="text/javascript">
					var language = \''.$settings['language'].'\';
				</script>';
		?>
	</body>
</html>
