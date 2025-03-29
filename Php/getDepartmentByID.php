<?php

	// example use from browser
	// http://localhost/companydirectory/libs/php/getDepartmentByID.php?id=<id>

	// remove next two lines for production	

	ini_set('display_errors', 'On');
	error_reporting(E_ALL);

	$executionStartTime = microtime(true);

	include("config.php");

	header('Content-Type: application/json; charset=UTF-8');

	$conn = new mysqli($cd_host, $cd_user, $cd_password, $cd_dbname, $cd_port, $cd_socket);

	if (mysqli_connect_errno()) {
		$output['status']['code'] = "300";
		$output['status']['name'] = "failure";
		$output['status']['description'] = "database unavailable failed";
		echo json_encode($output);
		exit;
	}	

   // Get Department Details
    $deptID = $_REQUEST['id'];

	$query = $conn->prepare('SELECT id, name, locationID FROM department WHERE id =  ?');
	$query->bind_param("i", $deptID);
	$query->execute();
	$result = $query->get_result();
	$department = $result->fetch_assoc();

	//Get All locations for dropdown
	$locationsQuery = $conn->query('SELECT id, name FROM location');
	$locations = [];

	while ($row = mysqli_fetch_assoc($locationsQuery)) {
		$locations[] = $row;
	}

	//Build JSON Response
	$output['status']['code'] = "200";
	$output['status']['name'] = "ok";
	$output['status']['description'] = "success";	
	$output['data']['department'] = $department;
	$output['data']['locations'] = $locations;

	echo json_encode($output);
	
	$conn->close();

?>