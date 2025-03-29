<?php
// Enable error reporting for debugging (remove for production)
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
    echo json_encode($output);
    exit;
}

// Retrieve form data
$firstName = $_POST['firstName'];
$lastName = $_POST['lastName'];
$jobTitle = $_POST['jobTitle'];
$email = $_POST['email'];
$departmentID = isset($_POST['departmentID']) && $_POST['departmentID'] !== "" ? $_POST['departmentID'] : null;

// Insert Personnel Query
$query = $conn->prepare("INSERT INTO personnel (firstName, lastName, jobTitle, email, departmentID) VALUES (?, ?, ?, ?, ?)");

$query->bind_param("ssssi", $firstName, $lastName, $jobTitle, $email, $departmentID);

$query->execute();

if ($query->affected_rows > 0) {
    $output['status']['code'] = "200";
    $output['status']['name'] = "ok";
    $output['status']['description'] = "success";
} else {
    $output['status']['code'] = "400";
    $output['status']['name'] = "executed";
    $output['status']['description'] = "query failed";
}

$query->close();
$conn->close();

echo json_encode($output);
?>