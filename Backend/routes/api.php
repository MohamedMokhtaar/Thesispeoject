<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AcademicStructureController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\FacultyClassController;
use App\Http\Controllers\CampusEnvironmentController;
use App\Http\Controllers\FacultyIssueController;
use App\Http\Controllers\FacultyNotificationController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\StudentManagementController;
use App\Http\Controllers\TeacherManagementController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/test', function() {
        return response()->json(['success' => true, 'message' => 'API is working']);
    });
});

Route::prefix('faculty')->group(function () {
    // Class Management
    Route::get('/classes', [FacultyClassController::class, 'index']);
    Route::get('/leaders', [FacultyClassController::class, 'listLeaders']);
    Route::get('/students', [FacultyClassController::class, 'getAllStudents']);
    Route::put('/classes/{cls_no}/leader', [FacultyClassController::class, 'updateLeader']);
    Route::post('/students/migrate', [FacultyClassController::class, 'migrateStudent']);
    Route::get('/classes/{cls_no}/students', [FacultyClassController::class, 'getClassStudents']);

    // Issue Management
    Route::get('/issues', [FacultyIssueController::class, 'index']);
    Route::get('/issues/stats', [FacultyIssueController::class, 'getDashboardStats']);
    Route::get('/issues/{id}', [FacultyIssueController::class, 'show']);
    Route::put('/issues/{id}/status', [FacultyIssueController::class, 'updateStatus']);

    // Campus Environment
    Route::get('/campus-environment/complaints', [CampusEnvironmentController::class, 'complaints']);
    Route::get('/campus-environment/tracking', [CampusEnvironmentController::class, 'tracking']);
    Route::get('/campus-environment/support/{cmp_env_com_no}', [CampusEnvironmentController::class, 'supportStudents']);
    Route::put('/campus-environment/{cmp_env_com_no}/status', [CampusEnvironmentController::class, 'updateStatus']);

    // Notifications
    Route::get('/notifications/{user_id}', [FacultyNotificationController::class, 'index']);
    Route::put('/notifications/{not_no}/read', [FacultyNotificationController::class, 'markAsRead']);
});

Route::prefix('student-management')->group(function () {
    Route::get('/addresses', [StudentManagementController::class, 'listAddresses']);
    Route::post('/addresses', [StudentManagementController::class, 'createAddress']);
    Route::put('/addresses/{add_no}', [StudentManagementController::class, 'updateAddress']);
    Route::delete('/addresses/{add_no}', [StudentManagementController::class, 'deleteAddress']);

    Route::get('/schools', [StudentManagementController::class, 'listSchools']);
    Route::post('/schools', [StudentManagementController::class, 'createSchool']);
    Route::put('/schools/{sch_no}', [StudentManagementController::class, 'updateSchool']);
    Route::delete('/schools/{sch_no}', [StudentManagementController::class, 'deleteSchool']);

    Route::get('/parents', [StudentManagementController::class, 'listParents']);
    Route::post('/parents', [StudentManagementController::class, 'createParent']);
    Route::put('/parents/{parent_no}', [StudentManagementController::class, 'updateParent']);
    Route::delete('/parents/{parent_no}', [StudentManagementController::class, 'deleteParent']);

    Route::get('/students', [StudentManagementController::class, 'listStudents']);
    Route::post('/students', [StudentManagementController::class, 'createStudent']);
    Route::put('/students/{std_id}', [StudentManagementController::class, 'updateStudent']);
    Route::delete('/students/{std_id}', [StudentManagementController::class, 'deleteStudent']);

    Route::get('/student-classes', [StudentManagementController::class, 'listStudentClasses']);
    Route::post('/student-classes', [StudentManagementController::class, 'createStudentClass']);
    Route::put('/student-classes/{sc_no}', [StudentManagementController::class, 'updateStudentClass']);
    Route::delete('/student-classes/{sc_no}', [StudentManagementController::class, 'deleteStudentClass']);

    Route::get('/classes-options', [StudentManagementController::class, 'listClassOptions']);
    Route::get('/semesters-options', [StudentManagementController::class, 'listSemesterOptions']);
    Route::get('/academics-options', [StudentManagementController::class, 'listAcademicOptions']);
    Route::get('/addresses-options', [StudentManagementController::class, 'listAddressOptions']);
    Route::get('/shifts-options', [StudentManagementController::class, 'listShiftOptions']);
});

Route::prefix('teacher-management')->group(function () {
    Route::get('/teachers', [TeacherManagementController::class, 'listTeachers']);
    Route::post('/teachers', [TeacherManagementController::class, 'createTeacher']);
    Route::put('/teachers/{teacher_no}', [TeacherManagementController::class, 'updateTeacher']);
    Route::delete('/teachers/{teacher_no}', [TeacherManagementController::class, 'deleteTeacher']);
});

Route::prefix('academic-structure')->group(function () {
    Route::get('/campuses', [AcademicStructureController::class, 'listCampuses']);
    Route::post('/campuses', [AcademicStructureController::class, 'createCampus']);
    Route::put('/campuses/{camp_no}', [AcademicStructureController::class, 'updateCampus']);
    Route::delete('/campuses/{camp_no}', [AcademicStructureController::class, 'deleteCampus']);

    Route::get('/faculties', [AcademicStructureController::class, 'listFaculties']);
    Route::post('/faculties', [AcademicStructureController::class, 'createFaculty']);
    Route::put('/faculties/{faculty_no}', [AcademicStructureController::class, 'updateFaculty']);
    Route::delete('/faculties/{faculty_no}', [AcademicStructureController::class, 'deleteFaculty']);

    Route::get('/departments', [AcademicStructureController::class, 'listDepartments']);
    Route::post('/departments', [AcademicStructureController::class, 'createDepartment']);
    Route::put('/departments/{dept_no}', [AcademicStructureController::class, 'updateDepartment']);
    Route::delete('/departments/{dept_no}', [AcademicStructureController::class, 'deleteDepartment']);

    Route::get('/classes', [AcademicStructureController::class, 'listClasses']);
    Route::post('/classes', [AcademicStructureController::class, 'createClass']);
    Route::put('/classes/{cls_no}', [AcademicStructureController::class, 'updateClass']);
    Route::delete('/classes/{cls_no}', [AcademicStructureController::class, 'deleteClass']);

    Route::get('/semesters', [AcademicStructureController::class, 'listSemesters']);
    Route::post('/semesters', [AcademicStructureController::class, 'createSemester']);
    Route::put('/semesters/{sem_no}', [AcademicStructureController::class, 'updateSemester']);
    Route::delete('/semesters/{sem_no}', [AcademicStructureController::class, 'deleteSemester']);

    Route::get('/academics', [AcademicStructureController::class, 'listAcademics']);
    Route::post('/academics', [AcademicStructureController::class, 'createAcademic']);
    Route::put('/academics/{acy_no}', [AcademicStructureController::class, 'updateAcademic']);
    Route::delete('/academics/{acy_no}', [AcademicStructureController::class, 'deleteAcademic']);

    Route::get('/subjects', [AcademicStructureController::class, 'listSubjects']);
    Route::post('/subjects', [AcademicStructureController::class, 'createSubject']);
    Route::put('/subjects/{sub_no}', [AcademicStructureController::class, 'updateSubject']);
    Route::delete('/subjects/{sub_no}', [AcademicStructureController::class, 'deleteSubject']);

    Route::get('/subject-classes', [AcademicStructureController::class, 'listSubjectClasses']);
    Route::post('/subject-classes', [AcademicStructureController::class, 'createSubjectClass']);
    Route::put('/subject-classes/{sub_cl_no}', [AcademicStructureController::class, 'updateSubjectClass']);
    Route::delete('/subject-classes/{sub_cl_no}', [AcademicStructureController::class, 'deleteSubjectClass']);

    Route::get('/teachers-options', [AcademicStructureController::class, 'listTeacherOptions']);
});

Route::prefix('settings')->group(function () {
    Route::get('/credentials', [SettingsController::class, 'listCredentials']);
});

Route::get('/profile/me', [ProfileController::class, 'me']);
