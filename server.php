<?php
  // "Proxy" to bypass same origin request header on the server, that we
  // don't have access!

  // CHANGE API URL AS NECESSARY 
  $apiURL = "https://server16786.contentdm.oclc.org/dmwebservices/index.php?q=";

  if(isset($_GET['url'])) {
    $url = preg_replace('/ /', '+', $_GET['url']);
    $requestURL = $apiURL . $url;
    echo file_get_contents($requestURL);
  }
 ?>
