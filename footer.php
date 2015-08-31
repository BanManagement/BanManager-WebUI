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
			<hr>
			<footer>
				<p class="pull-left"><?php echo $settings['footer']; ?><?php if(isset($settings['admin_link']) && $settings['admin_link']){echo ' &mdash; <a href="index.php?action=admin" target="_blank" style="color:inherit;"><span class="glyphicon glyphicon-dashboard"></span></a>';} echo ' &mdash; <a href="https://github.com/BanManagement/BanManager-WebUI" target="_blank">BanManager WebUI</a> version '.returnVersion(); ?></p>
				<!-- Must not be removed as per the licence terms -->
				<p class="pull-right">Created By <a href="http://www.frostcast.net" target="_blank">
					<img src="assets/images/brand.png" alt="Frostcast" id="copyright_image" />
				</a></p>
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
