<?php

namespace App\Http\Controllers;

use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class StudentManagementController extends Controller
{
    private function userHasColumn($column)
    {
        return Schema::hasColumn('users', $column);
    }

    private function studentSelectColumns()
    {
        return [
            'students.std_id',
            'students.user_id',
            'students.student_id',
            'students.name',
            'students.tell',
            'students.gender',
            'students.email as student_email',
            'students.add_no',
            'address.district as address_district',
            DB::raw("TRIM(BOTH ', ' FROM CONCAT_WS(', ', address.district, address.villages, address.area)) as address_label"),
            'students.dob',
            'students.parent_no',
            'parents.name as parent_name',
            'students.register_date',
            'students.mother',
            DB::raw('students.Pob as pob'),
            'students.graduation_year',
            'students.grade',
            'students.sch_no',
            'school.name as school_name',
            'students.nira',
            'students.shift_no',
            'shifts.shiftName as shift_name',
            'students.status',
            'users.username as account_username',
            $this->userHasColumn('email') ? 'users.email as account_email' : DB::raw('NULL as account_email'),
            $this->userHasColumn('status') ? 'users.status as account_status' : DB::raw('NULL as account_status'),
            'students.created_at',
            'students.updated_at'
        ];
    }

    private function studentBaseQuery()
    {
        return DB::table('students')
            ->join('users', 'students.user_id', '=', 'users.user_id')
            ->leftJoin('address', 'students.add_no', '=', 'address.add_no')
            ->leftJoin('parents', 'students.parent_no', '=', 'parents.parent_no')
            ->leftJoin('school', 'students.sch_no', '=', 'school.sch_no')
            ->leftJoin('shifts', 'students.shift_no', '=', 'shifts.shift_no');
    }

    public function listAddresses()
    {
        $addresses = DB::table('address')
            ->select('add_no', 'district', 'villages', 'area', 'created_at', 'updated_at')
            ->orderBy('add_no', 'DESC')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $addresses
        ]);
    }

    public function createAddress(Request $request)
    {
        $payload = $request->validate([
            'district' => ['required', 'string', 'max:100'],
            'villages' => ['nullable', 'string', 'max:100'],
            'area' => ['nullable', 'string', 'max:100']
        ]);

        $addNo = DB::table('address')->insertGetId([
            'district' => trim($payload['district']),
            'villages' => $payload['villages'] ?? null,
            'area' => $payload['area'] ?? null,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $created = DB::table('address')
            ->where('add_no', $addNo)
            ->select('add_no', 'district', 'villages', 'area', 'created_at', 'updated_at')
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Address created successfully.',
            'data' => $created
        ], 201);
    }

    public function updateAddress(Request $request, $add_no)
    {
        $existing = DB::table('address')->where('add_no', $add_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Address not found.'
            ], 404);
        }

        $payload = $request->validate([
            'district' => ['required', 'string', 'max:100'],
            'villages' => ['nullable', 'string', 'max:100'],
            'area' => ['nullable', 'string', 'max:100']
        ]);

        DB::table('address')
            ->where('add_no', $add_no)
            ->update([
                'district' => trim($payload['district']),
                'villages' => $payload['villages'] ?? null,
                'area' => $payload['area'] ?? null,
                'updated_at' => now()
            ]);

        $updated = DB::table('address')
            ->where('add_no', $add_no)
            ->select('add_no', 'district', 'villages', 'area', 'created_at', 'updated_at')
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Address updated successfully.',
            'data' => $updated
        ]);
    }

    public function deleteAddress($add_no)
    {
        $existing = DB::table('address')->where('add_no', $add_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Address not found.'
            ], 404);
        }

        try {
            DB::table('address')->where('add_no', $add_no)->delete();
        } catch (QueryException $e) {
            if ((int) $e->getCode() === 23000) {
                return response()->json([
                    'success' => false,
                    'message' => 'Address is linked to student records and cannot be deleted.'
                ], 409);
            }
            throw $e;
        }

        return response()->json([
            'success' => true,
            'message' => 'Address deleted successfully.'
        ]);
    }

    public function listSchools()
    {
        $schools = DB::table('school')
            ->select('sch_no', 'name', 'addres', 'created_at', 'updated_at')
            ->orderBy('sch_no', 'DESC')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $schools
        ]);
    }

    public function createSchool(Request $request)
    {
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:150', 'unique:school,name'],
            'addres' => ['nullable', 'string', 'max:255']
        ]);

        $schNo = DB::table('school')->insertGetId([
            'name' => trim($payload['name']),
            'addres' => $payload['addres'] ?? null,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $created = DB::table('school')
            ->where('sch_no', $schNo)
            ->select('sch_no', 'name', 'addres', 'created_at', 'updated_at')
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'School created successfully.',
            'data' => $created
        ], 201);
    }

    public function updateSchool(Request $request, $sch_no)
    {
        $existing = DB::table('school')->where('sch_no', $sch_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'School not found.'
            ], 404);
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:150', Rule::unique('school', 'name')->ignore($sch_no, 'sch_no')],
            'addres' => ['nullable', 'string', 'max:255']
        ]);

        DB::table('school')
            ->where('sch_no', $sch_no)
            ->update([
                'name' => trim($payload['name']),
                'addres' => $payload['addres'] ?? null,
                'updated_at' => now()
            ]);

        $updated = DB::table('school')
            ->where('sch_no', $sch_no)
            ->select('sch_no', 'name', 'addres', 'created_at', 'updated_at')
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'School updated successfully.',
            'data' => $updated
        ]);
    }

    public function deleteSchool($sch_no)
    {
        $existing = DB::table('school')->where('sch_no', $sch_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'School not found.'
            ], 404);
        }

        DB::table('school')->where('sch_no', $sch_no)->delete();

        return response()->json([
            'success' => true,
            'message' => 'School deleted successfully.'
        ]);
    }

    public function listParents()
    {
        $parents = DB::table('parents')
            ->select('parent_no', 'name', 'tell1', 'tell2', 'created_at', 'updated_at')
            ->orderBy('parent_no', 'DESC')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $parents
        ]);
    }

    public function createParent(Request $request)
    {
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'tell1' => ['nullable', 'string', 'max:30'],
            'tell2' => ['nullable', 'string', 'max:30']
        ]);

        $parentNo = DB::table('parents')->insertGetId([
            'name' => trim($payload['name']),
            'tell1' => $payload['tell1'] ?? null,
            'tell2' => $payload['tell2'] ?? null,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $created = DB::table('parents')
            ->where('parent_no', $parentNo)
            ->select('parent_no', 'name', 'tell1', 'tell2', 'created_at', 'updated_at')
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Parent created successfully.',
            'data' => $created
        ], 201);
    }

    public function updateParent(Request $request, $parent_no)
    {
        $existing = DB::table('parents')->where('parent_no', $parent_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Parent not found.'
            ], 404);
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'tell1' => ['nullable', 'string', 'max:30'],
            'tell2' => ['nullable', 'string', 'max:30']
        ]);

        DB::table('parents')
            ->where('parent_no', $parent_no)
            ->update([
                'name' => trim($payload['name']),
                'tell1' => $payload['tell1'] ?? null,
                'tell2' => $payload['tell2'] ?? null,
                'updated_at' => now()
            ]);

        $updated = DB::table('parents')
            ->where('parent_no', $parent_no)
            ->select('parent_no', 'name', 'tell1', 'tell2', 'created_at', 'updated_at')
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Parent updated successfully.',
            'data' => $updated
        ]);
    }

    public function deleteParent($parent_no)
    {
        $existing = DB::table('parents')->where('parent_no', $parent_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Parent not found.'
            ], 404);
        }

        DB::table('parents')->where('parent_no', $parent_no)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Parent deleted successfully.'
        ]);
    }

    public function listStudents()
    {
        $students = $this->studentBaseQuery()
            ->select($this->studentSelectColumns())
            ->orderBy('students.std_id', 'DESC')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $students
        ]);
    }

    public function createStudent(Request $request)
    {
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'tell' => ['nullable', 'string', 'max:30'],
            'gender' => ['nullable', 'string', 'max:15'],
            'student_email' => ['nullable', 'email', 'max:150'],
            'add_no' => ['nullable', 'integer', 'exists:address,add_no'],
            'dob' => ['nullable', 'date'],
            'parent_no' => ['nullable', 'integer', 'exists:parents,parent_no'],
            'sch_no' => ['nullable', 'integer', 'exists:school,sch_no'],
            'register_date' => ['nullable', 'date'],
            'mother' => ['nullable', 'string', 'max:150'],
            'pob' => ['required', 'string', 'max:100'],
            'graduation_year' => ['required', 'digits:4', 'integer', 'min:1900', 'max:2155'],
            'grade' => ['required', 'string', 'max:20'],
            'nira' => ['nullable', 'string', 'max:50'],
            'shift_no' => ['required', 'integer', 'exists:shifts,shift_no']
        ]);

        try {
            DB::statement(
                'CALL sp_create_student(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @o_user_id, @o_std_id, @o_student_id, @o_plain_password)',
                [
                    trim($payload['name']),
                    $payload['tell'] ?? null,
                    $payload['gender'] ?? null,
                    $payload['student_email'] ?? null,
                    $payload['add_no'] ?? null,
                    $payload['dob'] ?? null,
                    $payload['parent_no'] ?? null,
                    $payload['register_date'] ?? null,
                    $payload['mother'] ?? null,
                    trim($payload['pob']),
                    (int) $payload['graduation_year'],
                    trim($payload['grade']),
                    $payload['sch_no'] ?? null,
                    $payload['nira'] ?? null,
                    (int) $payload['shift_no']
                ]
            );
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create student using sp_create_student.',
                'error' => $e->getMessage()
            ], 500);
        }

        $spOut = DB::selectOne('SELECT @o_user_id AS user_id, @o_std_id AS std_id, @o_student_id AS student_id, @o_plain_password AS plain_password');
        if (!$spOut || empty($spOut->std_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Student created but sp_create_student outputs were not returned correctly.'
            ], 500);
        }

        $created = $this->studentBaseQuery()
            ->where('students.std_id', $spOut->std_id)
            ->select($this->studentSelectColumns())
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Student created successfully.',
            'data' => $created,
            'generated' => [
                'student_id' => $spOut->student_id,
                'plain_password' => $spOut->plain_password
            ]
        ], 201);
    }

    public function updateStudent(Request $request, $std_id)
    {
        $existing = DB::table('students')->where('std_id', $std_id)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found.'
            ], 404);
        }

        $rules = [
            'name' => ['required', 'string', 'max:150'],
            'tell' => ['nullable', 'string', 'max:30'],
            'gender' => ['nullable', 'string', 'max:15'],
            'student_email' => ['nullable', 'email', 'max:150'],
            'add_no' => ['nullable', 'integer', 'exists:address,add_no'],
            'dob' => ['nullable', 'date'],
            'parent_no' => ['nullable', 'integer', 'exists:parents,parent_no'],
            'sch_no' => ['nullable', 'integer', 'exists:school,sch_no'],
            'register_date' => ['nullable', 'date'],
            'mother' => ['nullable', 'string', 'max:150'],
            'pob' => ['required', 'string', 'max:100'],
            'graduation_year' => ['required', 'digits:4', 'integer', 'min:1900', 'max:2155'],
            'grade' => ['required', 'string', 'max:20'],
            'nira' => ['nullable', 'string', 'max:50'],
            'shift_no' => ['required', 'integer', 'exists:shifts,shift_no'],
            'status' => ['nullable', 'in:Active,Inactive']
        ];

        if ($request->filled('student_id')) {
            $rules['student_id'] = ['string', 'max:50', Rule::unique('students', 'student_id')->ignore($std_id, 'std_id')];
        }

        if ($this->userHasColumn('email')) {
            $rules['student_email'] = ['nullable', 'email', 'max:150', Rule::unique('users', 'email')->ignore($existing->user_id, 'user_id')];
        }

        $payload = $request->validate($rules);

        DB::transaction(function () use ($existing, $payload, $std_id) {
            $resolvedStudentId = trim($payload['student_id'] ?? $existing->student_id);
            $userUpdate = [
                'updated_at' => now()
            ];

            if ($this->userHasColumn('full_name')) {
                $userUpdate['full_name'] = trim($payload['name']);
            }
            if ($this->userHasColumn('username')) {
                $userUpdate['username'] = $resolvedStudentId;
            }
            if ($this->userHasColumn('email')) {
                $userUpdate['email'] = $payload['student_email'] ?? null;
            }
            if ($this->userHasColumn('status') && array_key_exists('status', $payload)) {
                $userUpdate['status'] = $payload['status'];
            }

            DB::table('users')
                ->where('user_id', $existing->user_id)
                ->update($userUpdate);

            DB::table('students')
                ->where('std_id', $std_id)
                ->update([
                    'student_id' => $resolvedStudentId,
                    'name' => trim($payload['name']),
                    'tell' => $payload['tell'] ?? null,
                    'gender' => $payload['gender'] ?? null,
                    'email' => $payload['student_email'] ?? null,
                    'add_no' => $payload['add_no'] ?? null,
                    'dob' => $payload['dob'] ?? null,
                    'parent_no' => $payload['parent_no'] ?? null,
                    'sch_no' => $payload['sch_no'] ?? null,
                    'register_date' => $payload['register_date'] ?? null,
                    'mother' => $payload['mother'] ?? null,
                    'Pob' => trim($payload['pob']),
                    'graduation_year' => (int) $payload['graduation_year'],
                    'grade' => trim($payload['grade']),
                    'nira' => $payload['nira'] ?? null,
                    'shift_no' => (int) $payload['shift_no'],
                    'status' => $payload['status'] ?? $existing->status,
                    'updated_at' => now()
                ]);
        });

        $updated = $this->studentBaseQuery()
            ->where('students.std_id', $std_id)
            ->select($this->studentSelectColumns())
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Student updated successfully.',
            'data' => $updated
        ]);
    }

    public function deleteStudent($std_id)
    {
        $existing = DB::table('students')->where('std_id', $std_id)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found.'
            ], 404);
        }

        try {
            DB::transaction(function () use ($existing, $std_id) {
                DB::table('students')->where('std_id', $std_id)->delete();
                DB::table('users')->where('user_id', $existing->user_id)->delete();
            });
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete student because it is linked to other records.'
            ], 409);
        }

        return response()->json([
            'success' => true,
            'message' => 'Student deleted successfully.'
        ]);
    }

    public function listStudentClasses()
    {
        $rows = DB::table('studet_classes')
            ->join('students', 'studet_classes.std_id', '=', 'students.std_id')
            ->join('classes', 'studet_classes.cls_no', '=', 'classes.cls_no')
            ->join('semesters', 'studet_classes.sem_no', '=', 'semesters.sem_no')
            ->join('academics', 'studet_classes.acy_no', '=', 'academics.acy_no')
            ->select(
                'studet_classes.sc_no',
                'studet_classes.std_id',
                'students.student_id',
                'students.name as student_name',
                'studet_classes.cls_no',
                'classes.cl_name',
                'studet_classes.sem_no',
                'semesters.semister_name',
                'studet_classes.acy_no',
                'academics.active_year',
                'studet_classes.created_at',
                'studet_classes.updated_at'
            )
            ->orderBy('studet_classes.sc_no', 'DESC')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rows
        ]);
    }

    public function createStudentClass(Request $request)
    {
        $payload = $request->validate([
            'std_id' => ['required', 'integer', 'exists:students,std_id'],
            'cls_no' => ['required', 'integer', 'exists:classes,cls_no'],
            'sem_no' => ['required', 'integer', 'exists:semesters,sem_no'],
            'acy_no' => ['required', 'integer', 'exists:academics,acy_no']
        ]);

        $exists = DB::table('studet_classes')
            ->where('std_id', $payload['std_id'])
            ->where('cls_no', $payload['cls_no'])
            ->where('sem_no', $payload['sem_no'])
            ->where('acy_no', $payload['acy_no'])
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Student class mapping already exists.'
            ], 422);
        }

        $scNo = DB::table('studet_classes')->insertGetId([
            'std_id' => $payload['std_id'],
            'cls_no' => $payload['cls_no'],
            'sem_no' => $payload['sem_no'],
            'acy_no' => $payload['acy_no'],
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $created = DB::table('studet_classes')
            ->join('students', 'studet_classes.std_id', '=', 'students.std_id')
            ->join('classes', 'studet_classes.cls_no', '=', 'classes.cls_no')
            ->join('semesters', 'studet_classes.sem_no', '=', 'semesters.sem_no')
            ->join('academics', 'studet_classes.acy_no', '=', 'academics.acy_no')
            ->where('studet_classes.sc_no', $scNo)
            ->select(
                'studet_classes.sc_no',
                'studet_classes.std_id',
                'students.student_id',
                'students.name as student_name',
                'studet_classes.cls_no',
                'classes.cl_name',
                'studet_classes.sem_no',
                'semesters.semister_name',
                'studet_classes.acy_no',
                'academics.active_year',
                'studet_classes.created_at',
                'studet_classes.updated_at'
            )
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Student class mapping created successfully.',
            'data' => $created
        ], 201);
    }

    public function updateStudentClass(Request $request, $sc_no)
    {
        $existing = DB::table('studet_classes')->where('sc_no', $sc_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Student class mapping not found.'
            ], 404);
        }

        $payload = $request->validate([
            'std_id' => ['required', 'integer', 'exists:students,std_id'],
            'cls_no' => ['required', 'integer', 'exists:classes,cls_no'],
            'sem_no' => ['required', 'integer', 'exists:semesters,sem_no'],
            'acy_no' => ['required', 'integer', 'exists:academics,acy_no']
        ]);

        $duplicate = DB::table('studet_classes')
            ->where('sc_no', '!=', $sc_no)
            ->where('std_id', $payload['std_id'])
            ->where('cls_no', $payload['cls_no'])
            ->where('sem_no', $payload['sem_no'])
            ->where('acy_no', $payload['acy_no'])
            ->exists();

        if ($duplicate) {
            return response()->json([
                'success' => false,
                'message' => 'Student class mapping already exists.'
            ], 422);
        }

        DB::table('studet_classes')
            ->where('sc_no', $sc_no)
            ->update([
                'std_id' => $payload['std_id'],
                'cls_no' => $payload['cls_no'],
                'sem_no' => $payload['sem_no'],
                'acy_no' => $payload['acy_no'],
                'updated_at' => now()
            ]);

        $updated = DB::table('studet_classes')
            ->join('students', 'studet_classes.std_id', '=', 'students.std_id')
            ->join('classes', 'studet_classes.cls_no', '=', 'classes.cls_no')
            ->join('semesters', 'studet_classes.sem_no', '=', 'semesters.sem_no')
            ->join('academics', 'studet_classes.acy_no', '=', 'academics.acy_no')
            ->where('studet_classes.sc_no', $sc_no)
            ->select(
                'studet_classes.sc_no',
                'studet_classes.std_id',
                'students.student_id',
                'students.name as student_name',
                'studet_classes.cls_no',
                'classes.cl_name',
                'studet_classes.sem_no',
                'semesters.semister_name',
                'studet_classes.acy_no',
                'academics.active_year',
                'studet_classes.created_at',
                'studet_classes.updated_at'
            )
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Student class mapping updated successfully.',
            'data' => $updated
        ]);
    }

    public function deleteStudentClass($sc_no)
    {
        $existing = DB::table('studet_classes')->where('sc_no', $sc_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Student class mapping not found.'
            ], 404);
        }

        DB::table('studet_classes')->where('sc_no', $sc_no)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Student class mapping deleted successfully.'
        ]);
    }

    public function listClassOptions()
    {
        $rows = DB::table('classes')
            ->select('cls_no', 'cl_name')
            ->orderBy('cl_name', 'ASC')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rows
        ]);
    }

    public function listSemesterOptions()
    {
        $rows = DB::table('semesters')
            ->select('sem_no', 'semister_name')
            ->orderBy('sem_no', 'DESC')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rows
        ]);
    }

    public function listAcademicOptions()
    {
        $rows = DB::table('academics')
            ->select('acy_no', 'active_year')
            ->orderBy('acy_no', 'DESC')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rows
        ]);
    }

    public function listAddressOptions()
    {
        $rows = DB::table('address')
            ->select(
                'add_no',
                'district',
                'villages',
                'area',
                DB::raw("TRIM(BOTH ', ' FROM CONCAT_WS(', ', district, villages, area)) as address_label")
            )
            ->orderBy('add_no', 'DESC')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rows
        ]);
    }

    public function listShiftOptions()
    {
        $rows = DB::table('shifts')
            ->select('shift_no', 'shiftName')
            ->orderBy('shift_no', 'ASC')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rows
        ]);
    }
}
