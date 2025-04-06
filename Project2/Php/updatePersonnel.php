<?php
header('Content-Type: application/json');

include("db.php");

$response = [];

$requiredFields = ['id', 'firstName', 'lastName', 'jobTitle', 'email', 'departmentID'];

foreach ($requiredFields as $field) {
    if (!isset($_POST[$field]) || $_POST[$field] === "") {
        echo json_encode([
            "status" => [
                "code" => 500,
                "description" => "error"
            ],
            "message" => "❌ Missing required fields."
        ]);
        exit;
    }
}

$id = $_POST['id'];
$firstName = $_POST['firstName'];
$lastName = $_POST['lastName'];
$jobTitle = $_POST['jobTitle'];
$email = $_POST['email'];
$departmentID = $_POST['departmentID'] === "" ? null : $_POST['departmentID'];

try {
    $query = $conn->prepare("UPDATE personnel SET firstName = ?, lastName = ?, jobTitle = ?, email = ?, departmentID = ? WHERE id = ?");
    $query->bind_param("ssssii", $firstName, $lastName, $jobTitle, $email, $departmentID, $id);
    $query->execute();

    echo json_encode([
        "status" => [
            "code" => 200,
            "description" => "success"
        ],
        "message" => "✅ Personnel updated successfully!"
    ]);

} catch (Exception $e) {
    echo json_encode([
        "status" => [
            "code" => 500,
            "description" => "query failed"
        ],
        "message" => "❌ Error updating personnel: " . $e->getMessage()
    ]);
}
?>
