<?php

	// example use from browser
	// http://localhost/companydirectory/libs/php/insertDepartment.php?name=New%20Department&locationID=<id>

	// remove next two lines for production

	ini_set('display_errors', 'On');
	error_reporting(E_ALL);
	
	$executionStartTime = microtime(true);
	
	include("config.php");
	
	header('Content-Type: application/json; charset=UTF-8');
	
	$conn = new mysqli($cd_host, $cd_user, $cd_password, $cd_dbname, $cd_port, $cd_socket);
	
	if ($conn->connect_errno) {
		$output['status']['code'] = "300";
		$output['status']['name'] = "failure";
		$output['status']['description'] = "database unavailable";
		echo json_encode($output);
		exit;
	}
	
	$name = trim(strtolower($_POST['name'])); // normalize name
	$locationID = $_POST['locationID'];
	
	// 🧠 Fix: Make sure we do case-insensitive check
	$checkQuery = $conn->prepare("SELECT id FROM department WHERE LOWER(name) = ? AND locationID = ?");
	$checkQuery->bind_param("si", $name, $locationID);
	$checkQuery->execute();
	$checkResult = $checkQuery->get_result();
	
	if ($checkResult->num_rows > 0) {
		$output['status']['code'] = "409";
		$output['status']['name'] = "conflict";
		$output['status']['description'] = "Department already exists in this location.";
	} else {
		// Insert using original name (not lowercased)
		$originalName = $_POST['name'];
		$insertQuery = $conn->prepare("INSERT INTO department (name, locationID) VALUES (?, ?)");
		$insertQuery->bind_param("si", $originalName, $locationID);
		$insertQuery->execute();
	
		$output['status']['code'] = "200";
		$output['status']['name'] = "ok";
		$output['status']['description'] = "Department added successfully!";
	}
	
	$conn->close();
	echo json_encode($output);
	?>