<?php
  // "Proxy" to bypass same origin request header on the server, that we
  // don't have access!
  echo file_get_contents($_GET['url']);
 ?>
