<?php
  	header('Access-Control-Allow-Origin: *');
  	header('Content-type: application/xml');
	$url = 'http://citypulse.torshavn.fo/admin/rest/' . $_GET['q'];
	echo file_get_contents($url);
?>