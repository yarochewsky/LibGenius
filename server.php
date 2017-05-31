<?php
  // "Proxy" to bypass same origin request header on the server, that we
  // don't have access!
  if(isset($_GET['url'])) {
    $url = preg_replace('/ /', '+', $_GET['url']);
    echo file_get_contents($url);
  }
 ?>
