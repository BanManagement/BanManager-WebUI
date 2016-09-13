<?php

if(!isset($_SESSION['admin']) || (isset($_SESSION['admin']) && !$_SESSION['admin']))
  die('Hacking attempt');
else if(!isset($_GET['authid']) || (isset($_GET['authid']) && $_GET['authid'] != sha1($settings['password'])))
  die('Hacking attempt');
else {
  if($settings['apc_enabled']) {
    apc_clear_cache('user');
  } else {
    array_map('unlink', glob(IN_PATH.'cache/*.php'));

    $i = 0;
    for($i = 0; $i < count($settings['servers']); ++$i) {
      deleteDirectory(IN_PATH.'cache/'.$i);
    }
  }

  redirect('index.php?action=admin');
}

//Delete folder function
function deleteDirectory($dir) {
    if (!file_exists($dir)) return true;
    if (!is_dir($dir) || is_link($dir)) return unlink($dir);
        foreach (scandir($dir) as $item) {
            if ($item == '.' || $item == '..') continue;
            if (!deleteDirectory($dir . "/" . $item)) {
                chmod($dir . "/" . $item, 0777);
                if (!deleteDirectory($dir . "/" . $item)) return false;
            };
        }
    return rmdir($dir);
}

?>
