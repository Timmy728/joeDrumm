$(document).ready(function () {
    loadPersonnel();
    loadDepartments();
    loadLocations();
});

// 🔁 Reload correct table when switching tabs
$('button[data-bs-toggle="tab"]').on('shown.bs.tab', function (e) {
    const target = $(e.target).attr('id');

    if (target === "personnelBtn") {
        loadPersonnel();
    } else if (target === "departmentsBtn") {
        loadDepartments();
    } else if (target === "locationsBtn") {
        loadLocations();
    }
});

// 🟢 SEARCH FUNCTION
$("#searchInp").on("keyup", function () {
    let searchQuery = $(this).val().trim();

    console.log("🔍 Searching for:", searchQuery);

    if (searchQuery.length < 1) {
        console.log("🔍 Search query is empty. Reloading all personnel.");
        loadPersonnel();
        return;
    }

    $.ajax({
        url: "Php/searchAll.php",
        type: "GET",
        data: { txt: searchQuery },
        dataType: "json",
        success: function (response) {
            console.log("✅ Debug - Full response:", response);

            if (response.status.code == 200) {
                let personnelTable = $("#personnelTableBody");
                personnelTable.empty(); // Clear previous results

                if (!response.data || !Array.isArray(response.data.found)) {
                    console.log("⚠️ No valid personnel data found.");
                    personnelTable.append('<tr><td colspan="5" class="text-center">No results found</td></tr>');
                    return;
                }

                let personnelList = response.data.found;
                console.log("✅ Processed search results:", personnelList);

                if (personnelList.length === 0) {
                    personnelTable.append('<tr><td colspan="5" class="text-center">No results found</td></tr>');
                } else {
                    personnelList.forEach(person => {
                        let row = `<tr>
                            <td class="align-middle text-nowrap">${person.lastName}, ${person.firstName}</td>
                            <td class="align-middle text-nowrap d-none d-md-table-cell">${person.departmentName ?? 'Unassigned'}</td>
                            <td class="align-middle text-nowrap d-none d-md-table-cell">${person.locationName ?? 'Unassigned'}</td>
                            <td class="align-middle text-nowrap d-none d-md-table-cell">${person.email}</td>
                            <td class="text-end text-nowrap">
                                <button type="button" class="btn btn-primary btn-sm editPersonnelBtn" data-id="${person.id}">
                                    <i class="fa-solid fa-pencil fa-fw"></i>
                                </button>
                                <button type="button" class="btn btn-danger btn-sm deletePersonnelBtn" data-id="${person.id}">
                                    <i class="fa-solid fa-trash fa-fw"></i>
                                </button>
                            </td>
                        </tr>`;

                        personnelTable.append(row);
                    });
                }
            } else {
                console.log("❌ Search failed:", response.status.description);
                alert("Error searching personnel.");
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log("❌ AJAX Error:", textStatus, errorThrown);
            alert("Error searching personnel.");
        }
    });
});

//Handle for Personnel, Department & location
$("#addBtn").off("click").on("click", function () {
  if ($("#personnel-tab-pane").hasClass("active")) {
    $("#addPersonnelModal").modal("show");
    loadDepartmentsForDropdown();
  } else if ($("#departments-tab-pane").hasClass("active")) {
    $("#addDepartmentModal").modal("show");
    loadLocationsForDropdown();
  } else if ($("#locations-tab-pane").hasClass("active")) {
    $("#addLocationModal").modal("show");
  }
});


// 🟢 REFRESH BUTTON FUNCTION
$("#refreshBtn").click(function () {
    if ($("#personnelBtn").hasClass("active")) {
        loadPersonnel();
    } else if ($("#departmentsBtn").hasClass("active")) {
        loadDepartments();
    } else {
        loadLocations();
    }
});

// 🟢 FILTER FUNCTION (Open Modal for Filtering)
$("#filterBtn").click(function () {
    $("#filterModal").modal("show");
});

// 🟢 LOAD PERSONNEL FROM DATABASE
function loadPersonnel() {
    $("#searchInp").val(""); //Clears the search input
    
    $.ajax({
        url: "Php/getAll.php",
        type: "GET",
        dataType: "json",
        success: function (response) {
            console.log("✅ Debug - Full personnel response:", response);

            let personnelTable = $("#personnelTableBody");
            personnelTable.empty();

            if (!response.data || !Array.isArray(response.data)) {
                console.log("⚠️ No valid personnel data found.");
                personnelTable.append('<tr><td colspan="5" class="text-center">No personnel data available</td></tr>');
                return;
            }

            let personnelList = response.data;
            console.log("✅ Processed personnel data:", personnelList);

            let html = "";
            personnelList.forEach(person => {
                let personID = person.id ?? ''; // Ensure ID is not undefined
                console.log(`Adding row for ${person.firstName} ${person.lastName} - ID: ${personID}`);

                html += `
                    <tr>
                        <td>${person.lastName}, ${person.firstName}</td>
                        <td>${person.department ?? "Unassigned"}</td>
                        <td>${person.location ?? "Unassigned"}</td>
                        <td>${person.email}</td>
                        <td class="text-end text-nowrap">
                            <button type="button" class="btn btn-primary btn-sm editPersonnelBtn" data-id="${personID}">
                                <i class="fa-solid fa-pencil"></i>
                            </button>
                            <button type="button" class="btn btn-danger btn-sm deletePersonnelBtn" data-id="${personID}">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });

            personnelTable.append(html);

            // 🔹 Ensure event delegation for dynamically added buttons
            $(document).off("click", ".editPersonnelBtn").on("click", ".editPersonnelBtn", function () {
                let personID = $(this).attr("data-id");
                console.log("Editing ID:", personID);

                if (!personID) {
                    console.log("❌ Error: No ID found on button");
                    return;
                }

                $.ajax({
                    url: "Php/getPersonnelByID.php",
                    type: "POST",
                    dataType: "json",
                    data: { id: personID },
                    success: function (result) {
                        if (result.status.code == 200) {
                            $("#editPersonnelEmployeeID").val(result.data.personnel[0].id);
                            $("#editPersonnelFirstName").val(result.data.personnel[0].firstName);
                            $("#editPersonnelLastName").val(result.data.personnel[0].lastName);
                            $("#editPersonnelJobTitle").val(result.data.personnel[0].jobTitle);
                            $("#editPersonnelEmailAddress").val(result.data.personnel[0].email);
                            
                            $("#editPersonnelDepartment").html("");
                            $.each(result.data.department, function () {
                                $("#editPersonnelDepartment").append(
                                    $("<option>", {
                                        value: this.id,
                                        text: this.name
                                    })
                                );
                            });
                            $("#editPersonnelDepartment").val(result.data.personnel[0].departmentID);

                            $("#editPersonnelModal").modal("show");

                        } else {
                            alert("Error retrieving data.");
                        }
                    },
                    error: function () {
                        alert("Error retrieving data.");
                    }
                });
            });

            // 🔹 Log all buttons to check data-id
            console.log("🔍 Checking all edit buttons:", $(".editPersonnelBtn"));
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log("❌ Error loading personnel:", textStatus, errorThrown);
            alert("Error loading personnel.");
        }
    });
}

// 🟢 LOAD DEPARTMENTS FROM DATABASE
function loadDepartments() {
    $.ajax({
        url: "Php/getAllDepartments.php",
        type: "GET",
        dataType: "json",
        success: function (response) {
            let html = "";
            response.data.forEach((dept) => {
                html += `
                    <tr>
                        <td>${dept.name}</td>
                        <td>${dept.location}</td>
                        <td class="text-end text-nowrap">
                             <button type="button" class="btn btn-primary btn-sm editDepartmentBtn" data-id="${dept.id}">
                                <i class="fa-solid fa-pencil"></i>
                            </button>
                            <button type="button" class="btn btn-danger btn-sm deleteDepartmentBtn" data-id="${dept.id}">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            $("#departmentTableBody").html(html);
        },
        error: function () {
            alert("Error loading departments.");
        }
    });
}

// 🟢 LOAD LOCATIONS FROM DATABASE
function loadLocations() {
    $.ajax({
        url: "Php/getAllLocations.php",
        type: "GET",
        dataType: "json",
        success: function (response) {
            let locationTable = $("#locationTableBody");
            locationTable.empty();

            response.data.forEach(location => {
                let row = `<tr>
                    <td class="align-middle text-nowrap">${location.name}</td>
                    <td class="align-middle text-end text-nowrap">
                        <button type="button" class="btn btn-primary btn-sm editLocationBtn" data-id="${location.id}">
                            <i class="fa-solid fa-pencil"></i>
                        </button>
                        <button type="button" class="btn btn-danger btn-sm deleteLocationBtn" data-id="${location.id}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>`;

                locationTable.append(row);
            });

            console.log("Locations loaded successfully."); // Debugging
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log("Error loading locations:", textStatus, errorThrown);
        }
    });
}


// 🟢 HANDLE EDIT PERSONNEL MODAL
$(document).on("click", ".editPersonnelBtn", function () {
    let personID = $(this).attr("data-id");
    console.log("Editing ID: ", personID);

    if(!personID) {
        console.log("❌ Error: No ID found on button");
        return;
    }

    $.ajax({
        url: "Php/getPersonnelByID.php",
        type: "POST",
        dataType: "json",
        data: { id: personID },
        success: function (result) {
            if (result.status.code == 200) {
                $("#editPersonnelEmployeeID").val(result.data.personnel[0].id);
                $("#editPersonnelFirstName").val(result.data.personnel[0].firstName);
                $("#editPersonnelLastName").val(result.data.personnel[0].lastName);
                $("#editPersonnelJobTitle").val(result.data.personnel[0].jobTitle);
                $("#editPersonnelEmailAddress").val(result.data.personnel[0].email);
                
                $("#editPersonnelDepartment").html("");
                $.each(result.data.department, function () {
                    $("#editPersonnelDepartment").append(
                        $("<option>", {
                            value: this.id,
                            text: this.name
                        })
                    );
                });
                $("#editPersonnelDepartment").val(result.data.personnel[0].departmentID);

                $("#editPersonnelModal").modal("show");
            
            } else {
                alert("Error retrieving data.");
            }
        },
        error: function () {
            alert("Error retrieving data.");
        }
    });
});

// 🟢 HANDLE FORM SUBMIT FOR PERSONNEL EDIT
$("#editPersonnelForm").on("submit", function (e) {
    e.preventDefault();

    let formData = {
        id: $("#editPersonnelEmployeeID").val(),
        firstName: $("#editPersonnelFirstName").val(),
        lastName: $("#editPersonnelLastName").val(),
        jobTitle: $("#editPersonnelJobTitle").val(),
        email: $("#editPersonnelEmailAddress").val(),
        departmentID: $("#editPersonnelDepartment").val()
    };

    $.ajax({
        url: "Php/updatePersonnel.php",
        type: "POST",
        data: formData,
        success: function (response) {
            alert(response.message);
            $("#editPersonnelModal").modal("hide");
            loadPersonnel();
        },
        error: function () {
            alert("Error updating personnel.");
        }
    });
});

// DELETE PERSONNEL
$(document).on("click", ".deletePersonnelBtn", function () {
    const id = $(this).data("id");

    $.ajax({
        url: "Php/getPersonnelByID.php",
        type: "POST",
        dataType: "json",
        data: { id },
        success: function (res) {
            if (res.status.code == 200) {
                const person = res.data.personnel[0];
                $("#confirmDeleteMessage").text(`Are you sure you want to delete ${person.firstName} ${person.lastName}?`);
                $("#deleteEntityID").val(person.id);
                $("#confirmDeleteModal").data("type", "personnel").modal("show");
            } else {
                alert("❌ Could not fetch person details.");
            }
        }
    });
});

//Handle the modal’s form submission
$(document).on("submit", "#confirmDeleteForm", function (e) {
    e.preventDefault();

    const id = $("#deleteEntityID").val();
    const type = $("#confirmDeleteModal").data("type");

        if (!id || !type) {
        $("#confirmDeleteModal").modal("hide");
        return;
        }

    let url = "";
    if (type === "personnel") url = "Php/deletePersonnelByID.php";
    else if (type === "department") url = "Php/deleteDepartmentByID.php";
    else if (type === "location") url = "Php/deleteLocationByID.php";

    $.ajax({
        url,
        type: "POST",
        data: { id },
        dataType: "json",
        success: function (res) {
            if (res.status.code == 200 || res.status === "success") {
                $("#confirmDeleteModal").modal("hide");

                if (type === "personnel") loadPersonnel();
                else if (type === "department") loadDepartments();
                else if (type === "location") loadLocations();
            } else {
                alert("❌ Deletion failed.");
            }
        },
        error: function () {
            alert("❌ Error deleting.");
        }
    });
});


// 🟢 DELETE DEPARTMENT
$(document).on("click", ".deleteDepartmentBtn", function () {
    const deptID = $(this).data("id");

    // First: check for personnel dependencies
    $.ajax({
        url: "Php/checkDependencies.php",
        type: "POST",
        data: { departmentID: deptID },
        dataType: "json",
        success: function (response) {
            if (response.status.hasPersonnel) {
                // 🚫 Cannot delete — show styled modal message only
                $("#confirmDeleteMessage").text("❌ Cannot delete this department. It has one or more employees assigned.");

                $("#confirmDeleteModal .modal-footer").html(`
                    <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal">CLOSE</button>
                `);

                $("#deleteEntityID").val("");
                $("#confirmDeleteModal").data("type", "").modal("show");
                return;
            }

            // ✅ Safe to delete — fetch department name
            $.ajax({
                url: "Php/getDepartmentByID.php",
                type: "POST",
                dataType: "json",
                data: { id: deptID },
                success: function (res) {
                    if (res.status.code == 200) {
                        const dept = res.data.department;
                        $("#confirmDeleteMessage").text(`Delete department "${dept.name}"?`);
                        $("#deleteEntityID").val(dept.id);
                        $("#confirmDeleteModal").data("type", "department");

                        $("#confirmDeleteModal .modal-footer").html(`
                            <button type="submit" form="confirmDeleteForm" class="btn btn-outline-danger btn-sm">YES</button>
                            <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal">CANCEL</button>
                        `);

                        $("#confirmDeleteModal").modal("show");
                    } else {
                        alert("❌ Could not fetch department details.");
                    }
                },
                error: function () {
                    alert("❌ Error fetching department details.");
                }
            });
        },
        error: function () {
            alert("❌ Failed to check department dependencies.");
        }
    });
});



// 🟢 DELETE LOCATION
$(document).on("click", ".deleteLocationBtn", function () {
    const locationID = $(this).data("id");

    $.ajax({
        url: "Php/checkLocationDependencies.php",
        type: "POST",
        dataType: "json",
        data: { locationID },
        success: function (response) {
            if (response.status.hasDepartments) {
                $("#confirmDeleteMessage").text("❌ Cannot delete this location. It has one or more departments assigned.");

                // Replace modal footer with just CLOSE button
                $("#confirmDeleteModal .modal-footer").html(`
                    <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal">CLOSE</button>
                `);

                $("#deleteEntityID").val(""); 
                $("#confirmDeleteModal").data("type", "").modal("show");
                return;
            }

            // ELSE — safe to delete
            $.ajax({
                url: "Php/getLocationByID.php",
                type: "POST",
                dataType: "json",
                data: { id: locationID },
                success: function (res) {
                    if (res.status.code == 200) {
                        const location = res.data;
                        $("#confirmDeleteMessage").text(`Delete location "${location.name}"?`);
                        $("#deleteEntityID").val(location.id);
                        $("#confirmDeleteModal").data("type", "location");

                        // Restore YES + CANCEL buttons
                        $("#confirmDeleteModal .modal-footer").html(`
                            <button type="submit" form="confirmDeleteForm" class="btn btn-outline-danger btn-sm">YES</button>
                            <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal">CANCEL</button>
                        `);

                        $("#confirmDeleteModal").modal("show");
                    } else {
                        alert("❌ Could not fetch location.");
                    }
                },
                error: function () {
                    alert("❌ Error fetching location.");
                }
            });
        },
        error: function () {
            alert("❌ Failed to check location dependencies.");
        }
    });
});


// 🟢 Load Departments into Add Personnel Dropdown
function loadDepartmentsForDropdown() {
    $.ajax({
        url: "Php/getAllDepartments.php",
        type: "GET",
        dataType: "json",
        success: function (response) {
            let departmentDropdown = $("#addPersonnelDepartment");
            departmentDropdown.empty();
            departmentDropdown.append('<option value="">Unassigned</option>');

            response.data.forEach((dept) => {
                departmentDropdown.append(`<option value="${dept.id}">${dept.name}</option>`);
            });
        },
        error: function () {
            console.log("❌ Error loading departments for dropdown");
        }
    });
}

// 🟢 Handle Add Personnel Form Submission
$("#addPersonnelForm").on("submit", function (e) {
    e.preventDefault();

    let formData = {
        firstName: $("#addPersonnelFirstName").val(),
        lastName: $("#addPersonnelLastName").val(),
        jobTitle: $("#addPersonnelJobTitle").val(),
        email: $("#addPersonnelEmailAddress").val(),
        departmentID: $("#addPersonnelDepartment").val() || null // Null for Unassigned
    };

    $.ajax({
        url: "Php/insertPersonnel.php",
        type: "POST",
        data: formData,
        dataType: "json",
        success: function (response) {
            if (response.status.code == 200) {
                alert("✅ Employee added successfully!");
                $("#addPersonnelModal").modal("hide");
                loadPersonnel();
            } else {
                alert("❌ Error: " + response.status.description);
            }
        },
        error: function () {
            alert("❌ Error adding employee.");
        }
    });
});


//🟢 Adding Departments
$(document).on("click", "#addDepartmentBtn", function () {
    $("#addDepartmentModal").modal("show");
    loadLocationsForDropdown();
});

$(document).off("submit", "#addDepartmentForm").on("submit", "#addDepartmentForm", function (e) {
    e.preventDefault();

    let formData = {
        name: $("#addDepartmentName").val(),
        locationID: $("#addDepartmentLocation").val() || null
    };

    console.log("📤 Sending:", formData);

    $.ajax({
        url: "Php/insertDepartment.php",
        type: "POST",
        data: formData,
        dataType: "json",
        success: function (response) {
            console.log("✅ Insert Response:", response);

            if (response.status.code == 200) {
                alert("✅ Department added successfully!");
                $("#addDepartmentModal").modal("hide");
                loadDepartments();
            } else if (response.status.code == 409) {
                alert("❌ " + response.status.description);
            } else {
                alert("❌ Error: " + response.status.description);
            }
        },
        error: function () {
            alert("❌ Error adding department.");
        }
    });
});

// Editing Departments
$(document).on("click", ".editDepartmentBtn", function () {
    let deptID = $(this).attr("data-id");
    console.log("Editing Department ID:", deptID);

    if (!deptID) {
        console.log("❌ Error: No ID found on button");
        return;
    }

    $.ajax({
        url: "Php/getDepartmentByID.php",
        type: "POST",
        dataType: "json",
        data: { id: deptID },
        success: function (result) {
            console.log("✅ Full response from server:", result);

            if (result.status.code == 200) {
                let department = result.data.department; // Correct way to access the department
                let locations = result.data.locations; // Correct way to access locations array

                console.log("🎯 Selected Department:", department);
                console.log("📍 Available Locations:", locations);

                $("#editDepartmentID").val(department.id || "");
                $("#editDepartmentName").val(department.name || "");

                let locationDropdown = $("#editDepartmentLocation");
                locationDropdown.empty();
                locationDropdown.append('<option value="">Select a Location</option>'); // Default option

                if (Array.isArray(locations) && locations.length > 0) {
                    locations.forEach(location => {
                        let isSelected = (parseInt(location.id) === parseInt(department.locationID)) ? "selected" : "";
                        locationDropdown.append(`<option value="${location.id}" ${isSelected}>${location.name}</option>`);
                    });
                } else {
                    console.log("❌ No locations found in response.");
                }

                $("#editDepartmentModal").modal("show");
            } else {
                alert("❌ Error retrieving department data.");
            }
        },
        error: function () {
            alert("❌ Error retrieving department data.");
        }
    });
});

// Updating Departments
$(document).on("submit", "#editDepartmentForm", function (e) {
    e.preventDefault();
    
    let formData = {
        id: $("#editDepartmentID").val(),
        name: $("#editDepartmentName").val(),
        locationID: $("#editDepartmentLocation").val()
    };

    $.ajax({
        url: "Php/updateDepartment.php",
        type: "POST",
        data: formData,
        dataType: "json",
        success: function (response) {
            if (response.status.code == 200) {
                alert("✅ Department updated successfully!");
                $("#editDepartmentModal").modal("hide");
                loadDepartments();
            } else {
                alert("❌ Error: " + response.status.description);
            }
        },
        error: function () {
            alert("❌ Error updating department.");
        }
    });
});

// Prevent Deleting Departments with Assigned Personnel
$(document).on("click", ".deleteDepartmentBtn", function () {
    let deptID = $(this).attr("data-id");

    $.ajax({
        url: "Php/checkDependencies.php",
        type: "POST",
        data: { departmentID: deptID },
        dataType: "json",
        success: function (response) {
            if (response.status.hasPersonnel) {
                alert("❌ Cannot delete. Department has assigned personnel.");
            } else {
                if (confirm("Are you sure you want to delete this department?")) {
                    $.ajax({
                        url: "Php/deleteDepartmentByID.php",
                        type: "POST",
                        data: { id: deptID },
                        success: function (res) {
                            alert("✅ Department deleted.");
                            loadDepartments();
                        },
                        error: function () {
                            alert("❌ Failed to delete department.");
                        }
                    });
                }
            }
        }
    });
});

// Load Locations into the Dropdown
function loadLocationsForDropdown() {
    $.ajax({
        url: "Php/getAllLocations.php",
        type: "GET",
        dataType: "json",
        success: function (response) {
            let locationDropdown = $("#addDepartmentLocation");
            locationDropdown.empty();
            locationDropdown.append('<option value="">Select Location</option>');

            response.data.forEach((location) => {
                locationDropdown.append(`<option value="${location.id}">${location.name}</option>`);
            });
        },
        error: function () {
            console.log("❌ Error loading locations for dropdown");
        }
    });
}

//Handle "Add Department" Form Submission
//$("#addDepartmentForm").on("submit", function (e) { 
  //  e.preventDefault();

  //  let formData = {
  //      name: $("#addDepartmentName").val(),
  //      locationID: $("#addDepartmentLocation").val()
  //  };

  //  $.ajax({
  //      url: "Php/insertDepartment.php",
  //      type: "POST",
  //      data: formData,
  //      dataType: "json",
  //      success: function (response) {
  //          if (response.status.code == 200) {
  //              alert("✅ Department added successfully!");
  //              $("#addDepartmentModal").modal("hide");
  //              loadDepartments();
  //          } else {
  //              alert("❌ Error: " + response.status.description);
  //          }
  //      },
  //      error: function () {
  //          alert("❌ Error adding department.");
  //      }
  //  });
//});



// Handle Add Location Modal Submit
$(document).on("submit", "#addLocationForm", function (e) {
    e.preventDefault();

    const name = $("#addLocationName").val().trim();
    if (!name) return alert("Please enter a location name.");

    $.ajax({
        url: "Php/insertLocation.php",
        type: "POST",
        data: { name },
        dataType: "json",
        success: function (response) {
            if (response.status.code == 200 || response.status === "success") {
                alert("✅ Location added!");
                $("#addLocationModal").modal("hide");
                loadLocations();
            } else {
                alert("❌ " + (response.status.description || response.message));
            }
        },
        error: function () {
            alert("❌ Failed to add location.");
        }
    });
});


//Handle Edit Location Button click + Modal Submit
$(document).on("click", ".editLocationBtn", function () {
    const id = $(this).data("id");

    $.ajax({
        url: "Php/getLocationByID.php",
        type: "POST",
        data: { id },
        dataType: "json",
        success: function (res) {
            if (res.status.code == 200) {
                $("#editLocationID").val(res.data.id);
                $("#editLocationName").val(res.data.name);
                $("#editLocationModal").modal("show");
            } else {
                alert("❌ Location not found.");
            }
        },
        error: function () {
            alert("❌ Error fetching location.");
        }
    });
});
$(document).on("submit", "#editLocationForm", function (e) {
    e.preventDefault();

    const id = $("#editLocationID").val();
    const name = $("#editLocationName").val().trim();

    if (!name) return alert("Please enter a location name.");

    $.ajax({
        url: "Php/updateLocation.php",
        type: "POST",
        data: { id, name },
        dataType: "json",
        success: function (res) {
            if (res.status.code == 200 || res.status === "success") {
                alert("✅ Location updated!");
                $("#editLocationModal").modal("hide");
                loadLocations();
            } else {
                alert("❌ " + (res.status.description || res.message));
            }
        },
        error: function () {
            alert("❌ Error updating location.");
        }
    });
});


//Handle Delete Location
//$(document).on("click", ".deleteLocationBtn", function () {
  //  const id = $(this).data("id");

   // if (confirm("Are you sure you want to delete this location?")) {
     //   $.ajax({
       //     url: "Php/deleteLocationByID.php",
         //   type: "POST",
           // data: { id },
          //  dataType: "json",
          //  success: function (res) {
           //     if (res.status === "success") {
           //         alert("✅ Location deleted.");
             //       loadLocations();
               // } else {
             //       alert("❌ " + (res.message || "Failed to delete."));
            //    }
          //  },
         //   error: function () {
         //       alert("❌ Error deleting location.");
        //    }
      //  });
  //  }
//});


// 🟢 Open Add Location Modal
$(document).on("click", "#addLocationBtn", function () {
    $("#addLocationModal").modal("show");
  });

  

// 🟢 Handle Add Location Form Submission
$(document).off("submit", "#addLocationForm").on("submit", "#addLocationForm", function (e) {
    e.preventDefault();
  
    let name = $("#addLocationName").val().trim();
  
    if (name === "") {
      alert("❌ Location name is required.");
      return;
    }
  
    $.ajax({
      url: "Php/insertLocation.php",
      type: "POST",
      data: { name: name },
      dataType: "json",
      success: function (response) {
        if (response.status.code == 200) {
          alert("✅ Location added successfully!");
          $("#addLocationModal").modal("hide");
          $("#addLocationForm")[0].reset();
          loadLocations();
        } else {
          alert("❌ Error: " + response.status.description);
        }
      },
      error: function () {
        alert("❌ Failed to add location.");
      }
    });
  });
