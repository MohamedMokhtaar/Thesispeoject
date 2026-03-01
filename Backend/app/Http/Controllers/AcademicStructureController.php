<?php

namespace App\Http\Controllers;

use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class AcademicStructureController extends Controller
{
    private function campusColumn()
    {
        return Schema::hasColumn('campuses', 'name') ? 'name' : 'campus';
    }

    private function teacherTable()
    {
        return Schema::hasTable('teachers') ? 'teachers' : 'tearchers';
    }

    public function listCampuses()
    {
        $column = $this->campusColumn();
        $campuses = DB::table('campuses')
            ->select('camp_no', "{$column} as name", 'created_at', 'updated_at')
            ->orderBy('camp_no', 'DESC')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $campuses
        ]);
    }

    public function createCampus(Request $request)
    {
        $column = $this->campusColumn();
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:120', Rule::unique('campuses', $column)]
        ]);

        $campNo = DB::table('campuses')->insertGetId([
            $column => trim($payload['name']),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $created = DB::table('campuses')
            ->where('camp_no', $campNo)
            ->select('camp_no', "{$column} as name", 'created_at', 'updated_at')
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Campus created successfully.',
            'data' => $created
        ], 201);
    }

    public function updateCampus(Request $request, $camp_no)
    {
        $existing = DB::table('campuses')->where('camp_no', $camp_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Campus not found.'
            ], 404);
        }

        $column = $this->campusColumn();
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:120', Rule::unique('campuses', $column)->ignore($camp_no, 'camp_no')]
        ]);

        DB::table('campuses')
            ->where('camp_no', $camp_no)
            ->update([
                $column => trim($payload['name']),
                'updated_at' => now()
            ]);

        $updated = DB::table('campuses')
            ->where('camp_no', $camp_no)
            ->select('camp_no', "{$column} as name", 'created_at', 'updated_at')
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Campus updated successfully.',
            'data' => $updated
        ]);
    }

    public function deleteCampus($camp_no)
    {
        $existing = DB::table('campuses')->where('camp_no', $camp_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Campus not found.'
            ], 404);
        }

        try {
            DB::table('campuses')->where('camp_no', $camp_no)->delete();
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete campus because it is linked to other records.'
            ], 409);
        }

        return response()->json([
            'success' => true,
            'message' => 'Campus deleted successfully.'
        ]);
    }

    public function listFaculties()
    {
        $faculties = DB::table('faculties')
            ->select('faculty_no', 'name', 'created_at', 'updated_at')
            ->orderBy('faculty_no', 'DESC')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $faculties
        ]);
    }

    public function createFaculty(Request $request)
    {
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:150', 'unique:faculties,name']
        ]);

        $facultyNo = DB::table('faculties')->insertGetId([
            'name' => trim($payload['name']),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $created = DB::table('faculties')
            ->where('faculty_no', $facultyNo)
            ->select('faculty_no', 'name', 'created_at', 'updated_at')
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Faculty created successfully.',
            'data' => $created
        ], 201);
    }

    public function updateFaculty(Request $request, $faculty_no)
    {
        $existing = DB::table('faculties')->where('faculty_no', $faculty_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Faculty not found.'
            ], 404);
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:150', Rule::unique('faculties', 'name')->ignore($faculty_no, 'faculty_no')]
        ]);

        DB::table('faculties')
            ->where('faculty_no', $faculty_no)
            ->update([
                'name' => trim($payload['name']),
                'updated_at' => now()
            ]);

        $updated = DB::table('faculties')
            ->where('faculty_no', $faculty_no)
            ->select('faculty_no', 'name', 'created_at', 'updated_at')
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Faculty updated successfully.',
            'data' => $updated
        ]);
    }

    public function deleteFaculty($faculty_no)
    {
        $existing = DB::table('faculties')->where('faculty_no', $faculty_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Faculty not found.'
            ], 404);
        }

        try {
            DB::table('faculties')->where('faculty_no', $faculty_no)->delete();
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete faculty because it is linked to other records.'
            ], 409);
        }

        return response()->json([
            'success' => true,
            'message' => 'Faculty deleted successfully.'
        ]);
    }

    public function listDepartments(Request $request)
    {
        $query = DB::table('departments')
            ->join('faculties', 'departments.faculty_no', '=', 'faculties.faculty_no');

        if ($request->has('faculty_no')) {
            $query->where('departments.faculty_no', $request->faculty_no);
        }

        $departments = $query->select(
                'departments.dept_no',
                'departments.name',
                'departments.faculty_no',
                'faculties.name as faculty_name',
                'departments.created_at',
                'departments.updated_at'
            )
            ->orderBy('departments.dept_no', 'DESC')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $departments
        ]);
    }

    public function createDepartment(Request $request)
    {
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:150', 'unique:departments,name'],
            'faculty_no' => ['required', 'integer', 'exists:faculties,faculty_no']
        ]);

        $deptNo = DB::table('departments')->insertGetId([
            'name' => trim($payload['name']),
            'faculty_no' => $payload['faculty_no'],
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $created = DB::table('departments')
            ->join('faculties', 'departments.faculty_no', '=', 'faculties.faculty_no')
            ->where('departments.dept_no', $deptNo)
            ->select(
                'departments.dept_no',
                'departments.name',
                'departments.faculty_no',
                'faculties.name as faculty_name',
                'departments.created_at',
                'departments.updated_at'
            )
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Department created successfully.',
            'data' => $created
        ], 201);
    }

    public function updateDepartment(Request $request, $dept_no)
    {
        $existing = DB::table('departments')->where('dept_no', $dept_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Department not found.'
            ], 404);
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:150', Rule::unique('departments', 'name')->ignore($dept_no, 'dept_no')],
            'faculty_no' => ['required', 'integer', 'exists:faculties,faculty_no']
        ]);

        DB::table('departments')
            ->where('dept_no', $dept_no)
            ->update([
                'name' => trim($payload['name']),
                'faculty_no' => $payload['faculty_no'],
                'updated_at' => now()
            ]);

        $updated = DB::table('departments')
            ->join('faculties', 'departments.faculty_no', '=', 'faculties.faculty_no')
            ->where('departments.dept_no', $dept_no)
            ->select(
                'departments.dept_no',
                'departments.name',
                'departments.faculty_no',
                'faculties.name as faculty_name',
                'departments.created_at',
                'departments.updated_at'
            )
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Department updated successfully.',
            'data' => $updated
        ]);
    }

    public function deleteDepartment($dept_no)
    {
        $existing = DB::table('departments')->where('dept_no', $dept_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Department not found.'
            ], 404);
        }

        try {
            DB::table('departments')->where('dept_no', $dept_no)->delete();
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete department because it is linked to other records.'
            ], 409);
        }

        return response()->json([
            'success' => true,
            'message' => 'Department deleted successfully.'
        ]);
    }

    public function listClasses(Request $request)
    {
        $campusColumn = $this->campusColumn();
        $query = DB::table('classes')
            ->join('departments', 'classes.dept_no', '=', 'departments.dept_no')
            ->join('campuses', 'classes.camp_no', '=', 'campuses.camp_no');

        if ($request->has('dept_no')) {
            $query->where('classes.dept_no', $request->dept_no);
        }

        $classes = $query->select(
                'classes.cls_no',
                'classes.cl_name',
                'classes.dept_no',
                'departments.name as department_name',
                'classes.camp_no',
                "campuses.{$campusColumn} as campus_name",
                'classes.created_at',
                'classes.updated_at'
            )
            ->orderBy('classes.cls_no', 'DESC')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $classes
        ]);
    }

    public function createClass(Request $request)
    {
        $payload = $request->validate([
            'cl_name' => ['required', 'string', 'max:120', 'unique:classes,cl_name'],
            'dept_no' => ['required', 'integer', 'exists:departments,dept_no'],
            'camp_no' => ['required', 'integer', 'exists:campuses,camp_no']
        ]);

        $clsNo = DB::table('classes')->insertGetId([
            'cl_name' => trim($payload['cl_name']),
            'dept_no' => $payload['dept_no'],
            'camp_no' => $payload['camp_no'],
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $campusColumn = $this->campusColumn();
        $created = DB::table('classes')
            ->join('departments', 'classes.dept_no', '=', 'departments.dept_no')
            ->join('campuses', 'classes.camp_no', '=', 'campuses.camp_no')
            ->where('classes.cls_no', $clsNo)
            ->select(
                'classes.cls_no',
                'classes.cl_name',
                'classes.dept_no',
                'departments.name as department_name',
                'classes.camp_no',
                "campuses.{$campusColumn} as campus_name",
                'classes.created_at',
                'classes.updated_at'
            )
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Class created successfully.',
            'data' => $created
        ], 201);
    }

    public function updateClass(Request $request, $cls_no)
    {
        $existing = DB::table('classes')->where('cls_no', $cls_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Class not found.'
            ], 404);
        }

        $payload = $request->validate([
            'cl_name' => ['required', 'string', 'max:120', Rule::unique('classes', 'cl_name')->ignore($cls_no, 'cls_no')],
            'dept_no' => ['required', 'integer', 'exists:departments,dept_no'],
            'camp_no' => ['required', 'integer', 'exists:campuses,camp_no']
        ]);

        DB::table('classes')
            ->where('cls_no', $cls_no)
            ->update([
                'cl_name' => trim($payload['cl_name']),
                'dept_no' => $payload['dept_no'],
                'camp_no' => $payload['camp_no'],
                'updated_at' => now()
            ]);

        $campusColumn = $this->campusColumn();
        $updated = DB::table('classes')
            ->join('departments', 'classes.dept_no', '=', 'departments.dept_no')
            ->join('campuses', 'classes.camp_no', '=', 'campuses.camp_no')
            ->where('classes.cls_no', $cls_no)
            ->select(
                'classes.cls_no',
                'classes.cl_name',
                'classes.dept_no',
                'departments.name as department_name',
                'classes.camp_no',
                "campuses.{$campusColumn} as campus_name",
                'classes.created_at',
                'classes.updated_at'
            )
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Class updated successfully.',
            'data' => $updated
        ]);
    }

    public function deleteClass($cls_no)
    {
        $existing = DB::table('classes')->where('cls_no', $cls_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Class not found.'
            ], 404);
        }

        try {
            DB::table('classes')->where('cls_no', $cls_no)->delete();
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete class because it is linked to other records.'
            ], 409);
        }

        return response()->json([
            'success' => true,
            'message' => 'Class deleted successfully.'
        ]);
    }

    public function listSemesters()
    {
        $semesters = DB::table('semesters')
            ->select('sem_no', 'semister_name', 'created_at', 'updated_at')
            ->orderBy('sem_no', 'DESC')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $semesters
        ]);
    }

    public function createSemester(Request $request)
    {
        $payload = $request->validate([
            'semister_name' => ['required', 'string', 'max:50', 'unique:semesters,semister_name']
        ]);

        $semNo = DB::table('semesters')->insertGetId([
            'semister_name' => trim($payload['semister_name']),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $created = DB::table('semesters')
            ->where('sem_no', $semNo)
            ->select('sem_no', 'semister_name', 'created_at', 'updated_at')
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Semester created successfully.',
            'data' => $created
        ], 201);
    }

    public function updateSemester(Request $request, $sem_no)
    {
        $existing = DB::table('semesters')->where('sem_no', $sem_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Semester not found.'
            ], 404);
        }

        $payload = $request->validate([
            'semister_name' => ['required', 'string', 'max:50', Rule::unique('semesters', 'semister_name')->ignore($sem_no, 'sem_no')]
        ]);

        DB::table('semesters')
            ->where('sem_no', $sem_no)
            ->update([
                'semister_name' => trim($payload['semister_name']),
                'updated_at' => now()
            ]);

        $updated = DB::table('semesters')
            ->where('sem_no', $sem_no)
            ->select('sem_no', 'semister_name', 'created_at', 'updated_at')
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Semester updated successfully.',
            'data' => $updated
        ]);
    }

    public function deleteSemester($sem_no)
    {
        $existing = DB::table('semesters')->where('sem_no', $sem_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Semester not found.'
            ], 404);
        }

        try {
            DB::table('semesters')->where('sem_no', $sem_no)->delete();
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete semester because it is linked to other records.'
            ], 409);
        }

        return response()->json([
            'success' => true,
            'message' => 'Semester deleted successfully.'
        ]);
    }

    public function listSubjects()
    {
        $subjects = DB::table('subjects')
            ->select('sub_no', 'name', 'code', 'created_at', 'updated_at')
            ->orderBy('sub_no', 'DESC')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $subjects
        ]);
    }

    public function createSubject(Request $request)
    {
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => ['required', 'string', 'max:50', 'unique:subjects,code']
        ]);

        $subNo = DB::table('subjects')->insertGetId([
            'name' => trim($payload['name']),
            'code' => trim($payload['code']),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $created = DB::table('subjects')
            ->where('sub_no', $subNo)
            ->select('sub_no', 'name', 'code', 'created_at', 'updated_at')
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Subject created successfully.',
            'data' => $created
        ], 201);
    }

    public function updateSubject(Request $request, $sub_no)
    {
        $existing = DB::table('subjects')->where('sub_no', $sub_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Subject not found.'
            ], 404);
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => ['required', 'string', 'max:50', Rule::unique('subjects', 'code')->ignore($sub_no, 'sub_no')]
        ]);

        DB::table('subjects')
            ->where('sub_no', $sub_no)
            ->update([
                'name' => trim($payload['name']),
                'code' => trim($payload['code']),
                'updated_at' => now()
            ]);

        $updated = DB::table('subjects')
            ->where('sub_no', $sub_no)
            ->select('sub_no', 'name', 'code', 'created_at', 'updated_at')
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Subject updated successfully.',
            'data' => $updated
        ]);
    }

    public function deleteSubject($sub_no)
    {
        $existing = DB::table('subjects')->where('sub_no', $sub_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Subject not found.'
            ], 404);
        }

        try {
            DB::table('subjects')->where('sub_no', $sub_no)->delete();
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete subject because it is linked to other records.'
            ], 409);
        }

        return response()->json([
            'success' => true,
            'message' => 'Subject deleted successfully.'
        ]);
    }

    public function listSubjectClasses()
    {
        $teacherTable = $this->teacherTable();
        $rows = DB::table('subject_class')
            ->join('subjects', 'subject_class.sub_no', '=', 'subjects.sub_no')
            ->join('classes', 'subject_class.cls_no', '=', 'classes.cls_no')
            ->join("{$teacherTable} as teachers", 'subject_class.teacher_no', '=', 'teachers.teacher_no')
            ->select(
                'subject_class.sub_cl_no',
                'subject_class.sub_no',
                'subjects.name as subject_name',
                'subjects.code as subject_code',
                'subject_class.cls_no',
                'classes.cl_name',
                'subject_class.teacher_no',
                'teachers.name as teacher_name',
                'subject_class.created_at',
                'subject_class.updated_at'
            )
            ->orderBy('subject_class.sub_cl_no', 'DESC')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rows
        ]);
    }

    public function createSubjectClass(Request $request)
    {
        $payload = $request->validate([
            'sub_no' => ['required', 'integer', 'exists:subjects,sub_no'],
            'cls_no' => ['required', 'integer', 'exists:classes,cls_no'],
            'teacher_no' => ['required', 'integer', 'exists:' . $this->teacherTable() . ',teacher_no']
        ]);

        $exists = DB::table('subject_class')
            ->where('sub_no', $payload['sub_no'])
            ->where('cls_no', $payload['cls_no'])
            ->where('teacher_no', $payload['teacher_no'])
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Subject class mapping already exists.'
            ], 422);
        }

        $subClNo = DB::table('subject_class')->insertGetId([
            'sub_no' => $payload['sub_no'],
            'cls_no' => $payload['cls_no'],
            'teacher_no' => $payload['teacher_no'],
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $teacherTable = $this->teacherTable();
        $created = DB::table('subject_class')
            ->join('subjects', 'subject_class.sub_no', '=', 'subjects.sub_no')
            ->join('classes', 'subject_class.cls_no', '=', 'classes.cls_no')
            ->join("{$teacherTable} as teachers", 'subject_class.teacher_no', '=', 'teachers.teacher_no')
            ->where('subject_class.sub_cl_no', $subClNo)
            ->select(
                'subject_class.sub_cl_no',
                'subject_class.sub_no',
                'subjects.name as subject_name',
                'subjects.code as subject_code',
                'subject_class.cls_no',
                'classes.cl_name',
                'subject_class.teacher_no',
                'teachers.name as teacher_name',
                'subject_class.created_at',
                'subject_class.updated_at'
            )
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Subject class mapping created successfully.',
            'data' => $created
        ], 201);
    }

    public function updateSubjectClass(Request $request, $sub_cl_no)
    {
        $existing = DB::table('subject_class')->where('sub_cl_no', $sub_cl_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Subject class mapping not found.'
            ], 404);
        }

        $payload = $request->validate([
            'sub_no' => ['required', 'integer', 'exists:subjects,sub_no'],
            'cls_no' => ['required', 'integer', 'exists:classes,cls_no'],
            'teacher_no' => ['required', 'integer', 'exists:' . $this->teacherTable() . ',teacher_no']
        ]);

        $duplicate = DB::table('subject_class')
            ->where('sub_cl_no', '!=', $sub_cl_no)
            ->where('sub_no', $payload['sub_no'])
            ->where('cls_no', $payload['cls_no'])
            ->where('teacher_no', $payload['teacher_no'])
            ->exists();

        if ($duplicate) {
            return response()->json([
                'success' => false,
                'message' => 'Subject class mapping already exists.'
            ], 422);
        }

        DB::table('subject_class')
            ->where('sub_cl_no', $sub_cl_no)
            ->update([
                'sub_no' => $payload['sub_no'],
                'cls_no' => $payload['cls_no'],
                'teacher_no' => $payload['teacher_no'],
                'updated_at' => now()
            ]);

        $teacherTable = $this->teacherTable();
        $updated = DB::table('subject_class')
            ->join('subjects', 'subject_class.sub_no', '=', 'subjects.sub_no')
            ->join('classes', 'subject_class.cls_no', '=', 'classes.cls_no')
            ->join("{$teacherTable} as teachers", 'subject_class.teacher_no', '=', 'teachers.teacher_no')
            ->where('subject_class.sub_cl_no', $sub_cl_no)
            ->select(
                'subject_class.sub_cl_no',
                'subject_class.sub_no',
                'subjects.name as subject_name',
                'subjects.code as subject_code',
                'subject_class.cls_no',
                'classes.cl_name',
                'subject_class.teacher_no',
                'teachers.name as teacher_name',
                'subject_class.created_at',
                'subject_class.updated_at'
            )
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Subject class mapping updated successfully.',
            'data' => $updated
        ]);
    }

    public function deleteSubjectClass($sub_cl_no)
    {
        $existing = DB::table('subject_class')->where('sub_cl_no', $sub_cl_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Subject class mapping not found.'
            ], 404);
        }

        try {
            DB::table('subject_class')->where('sub_cl_no', $sub_cl_no)->delete();
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete subject class mapping because it is linked to other records.'
            ], 409);
        }

        return response()->json([
            'success' => true,
            'message' => 'Subject class mapping deleted successfully.'
        ]);
    }

    public function listTeacherOptions()
    {
        $rows = DB::table($this->teacherTable())
            ->select('teacher_no', 'name')
            ->orderBy('name', 'ASC')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rows
        ]);
    }

    public function listAcademics()
    {
        $academics = DB::table('academics')
            ->select('acy_no', 'start_date', 'end_date', 'active_year', 'created_at', 'updated_at')
            ->orderBy('acy_no', 'DESC')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $academics
        ]);
    }

    public function createAcademic(Request $request)
    {
        $payload = $request->validate([
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'active_year' => ['required', 'string', 'max:30', 'unique:academics,active_year']
        ]);

        $acyNo = DB::table('academics')->insertGetId([
            'start_date' => $payload['start_date'],
            'end_date' => $payload['end_date'],
            'active_year' => trim($payload['active_year']),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $created = DB::table('academics')
            ->where('acy_no', $acyNo)
            ->select('acy_no', 'start_date', 'end_date', 'active_year', 'created_at', 'updated_at')
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Academic session created successfully.',
            'data' => $created
        ], 201);
    }

    public function updateAcademic(Request $request, $acy_no)
    {
        $existing = DB::table('academics')->where('acy_no', $acy_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Academic session not found.'
            ], 404);
        }

        $payload = $request->validate([
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'active_year' => ['required', 'string', 'max:30', Rule::unique('academics', 'active_year')->ignore($acy_no, 'acy_no')]
        ]);

        DB::table('academics')
            ->where('acy_no', $acy_no)
            ->update([
                'start_date' => $payload['start_date'],
                'end_date' => $payload['end_date'],
                'active_year' => trim($payload['active_year']),
                'updated_at' => now()
            ]);

        $updated = DB::table('academics')
            ->where('acy_no', $acy_no)
            ->select('acy_no', 'start_date', 'end_date', 'active_year', 'created_at', 'updated_at')
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Academic session updated successfully.',
            'data' => $updated
        ]);
    }

    public function deleteAcademic($acy_no)
    {
        $existing = DB::table('academics')->where('acy_no', $acy_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Academic session not found.'
            ], 404);
        }

        try {
            DB::table('academics')->where('acy_no', $acy_no)->delete();
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete academic session because it is linked to other records.'
            ], 409);
        }

        return response()->json([
            'success' => true,
            'message' => 'Academic session deleted successfully.'
        ]);
    }
}
