<?php
  header('Content-Type: image/jpeg');
  $imageFile = $_POST["image"];
  $imagePointer = $_POST["pointer"];
  $filePath = "./images/{$imagePointer}.jpg";
  file_put_contents($filePath, file_get_contents($imageFile));
?>
