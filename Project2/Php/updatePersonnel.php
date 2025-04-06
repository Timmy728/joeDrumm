<?php
header('Content-Type: application/json');

include("db.php"); // Make sure this connects to your DB

try {
    // Validate required fields
    if (!isset($_POST['id'], $_POST['firstName'], $_POST['lastName'], $_POST['jobTitle'], $_POST['email'])) {
        throw new Exception("Missing required fields.");
    }

    $id = $_POST['id'];
    $firstName = trim($_POST['firstName']);
    $lastName = trim($_POST['lastName']);
    $jobTitle = trim($_POST['jobTitle']);
    $email = trim($_POST['email']);
    $departmentID = isset($_POST['departmentID']) && $_POST['departmentID'] !== "" ? $_POST['departmentID'] : null;

    $query = $conn->prepare(
        "UPDATE personnel 
         SET firstName = ?, lastName = ?, jobTitle = ?, email = ?, departmentID = ? 
         WHERE id = ?"
    );
    $query->bind_param("ssssii", $firstName, $lastName, $jobTitle, $email, $departmentID, $id);
    
    if ($query->execute()) {
        echo json_encode([
            "status" => ["code" => 200, "description" => "success"],
            "message" => "✅ Employee updated successfully!"
        ]);
    } else {
        throw new Exception("Database error: " . $query->error);
    }

    $query->close();
    $conn->close();

} catch (Exception $e) {
    echo json_encode([
        "status" => ["code" => 500, "description" => "error"],
        "message" => "❌ " . $e->getMessage()
    ]);
}
  
?>
