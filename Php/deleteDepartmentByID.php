<?php

// Enable error reporting for debugging
ini_set('display_errors', 'On');
error_reporting(E_ALL);

$executionStartTime = microtime(true);

include("config.php");

header('Content-Type: application/json; charset=UTF-8');

$conn = new mysqli($cd_host, $cd_user, $cd_password, $cd_dbname, $cd_port, $cd_socket);

if (mysqli_connect_errno()) {
    $output['status']['code'] = "300";
    $output['status']['name'] = "failure";
    $output['status']['description'] = "database unavailable";
    $output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
    $output['data'] = [];

    mysqli_close($conn);
    echo json_encode($output);
    exit;
}

$id = $_REQUEST['id']; // Get department ID

// **CHECK IF THERE ARE EMPLOYEES IN THIS DEPARTMENT**
$checkQuery = $conn->prepare("SELECT id FROM personnel WHERE departmentID = ?");
$checkQuery->bind_param("i", $id);
$checkQuery->execute();
$checkQuery->store_result();

if ($checkQuery->num_rows > 0) {
    // If employees exist, prevent deletion
    $output['status']['code'] = "403";
    $output['status']['name'] = "forbidden";
    $output['status']['description'] = "Cannot delete department with assigned employees";
    $output['data'] = [];
    
    mysqli_close($conn);
    echo json_encode($output);
    exit;
}

// **DELETE DEPARTMENT**
$query = $conn->prepare('DELETE FROM department WHERE id = ?');
$query->bind_param("i", $id);
$query->execute();

if ($query === false) {
    $output['status']['code'] = "400";
    $output['status']['name'] = "error";
    $output['status']['description'] = "query failed";
    $output['data'] = [];

    mysqli_close($conn);
    echo json_encode($output);
    exit;
}

$output['status']['code'] = "200";
$output['status']['name'] = "ok";
$output['status']['description'] = "success";
$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
$output['data'] = [];

mysqli_close($conn);
echo json_encode($output);

?>