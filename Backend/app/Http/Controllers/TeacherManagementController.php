<?php

namespace App\Http\Controllers;

use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class TeacherManagementController extends Controller
{
    private function userHasColumn($column)
    {
        return Schema::hasColumn('users', $column);
    }

    private function teacherTable()
    {
        if (Schema::hasTable('teachers')) return 'teachers';
        if (Schema::hasTable('tearchers')) return 'tearchers';
        return 'teachers';
    }

    private function teacherHasColumn($column)
    {
        return Schema::hasColumn($this->teacherTable(), $column);
    }

    private function teacherBaseQuery()
    {
        $table = $this->teacherTable();
        return DB::table("{$table} as teachers")
            ->leftJoin('users', 'teachers.user_id', '=', 'users.user_id');
    }

    private function teacherSelectColumns()
    {
        return [
            'teachers.teacher_no',
            'teachers.user_id',
            $this->teacherHasColumn('teacher_id') ? 'teachers.teacher_id' : DB::raw('NULL as teacher_id'),
            $this->teacherHasColumn('name') ? 'teachers.name' : DB::raw('NULL as name'),
            $this->teacherHasColumn('tell') ? 'teachers.tell' : DB::raw('NULL as tell'),
            $this->teacherHasColumn('email') ? 'teachers.email' : DB::raw('NULL as email'),
            $this->teacherHasColumn('gender') ? 'teachers.gender' : DB::raw('NULL as gender'),
            $this->teacherHasColumn('hire_date') ? 'teachers.hire_date' : DB::raw('NULL as hire_date'),
            $this->teacherHasColumn('status') ? 'teachers.status' : DB::raw('NULL as status'),
            $this->userHasColumn('username') ? 'users.username as account_username' : DB::raw('NULL as account_username'),
            $this->userHasColumn('email') ? 'users.email as account_email' : DB::raw('NULL as account_email'),
            $this->userHasColumn('status') ? 'users.status as account_status' : DB::raw('NULL as account_status'),
            'teachers.created_at',
            'teachers.updated_at'
        ];
    }

    public function listTeachers()
    {
        $rows = $this->teacherBaseQuery()
            ->select($this->teacherSelectColumns())
            ->orderBy('teachers.teacher_no', 'DESC')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rows
        ]);
    }

    public function createTeacher(Request $request)
    {
        $rules = [
            'name' => ['required', 'string', 'max:150'],
            'tell' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:150'],
            'gender' => ['nullable', 'string', 'max:15'],
            'add_no' => ['required', 'integer', 'exists:address,add_no'],
            'hire_date' => ['nullable', 'date']
        ];

        if ($this->userHasColumn('email')) {
            $rules['email'] = ['nullable', 'email', 'max:150', 'unique:users,email'];
        }

        $payload = $request->validate($rules);

        try {
            DB::statement(
                'CALL sp_create_teacher(?, ?, ?, ?, ?, ?, @o_user_id, @o_teacher_no, @o_teacher_id, @o_plain_password)',
                [
                    trim($payload['name']),
                    $payload['tell'] ?? null,
                    $payload['email'] ?? null,
                    $payload['gender'] ?? null,
                    $payload['add_no'],
                    $payload['hire_date'] ?? null
                ]
            );
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create teacher using sp_create_teacher.',
                'error' => $e->getMessage()
            ], 500);
        }

        $spOut = DB::selectOne('SELECT @o_user_id AS user_id, @o_teacher_no AS teacher_no, @o_teacher_id AS teacher_id, @o_plain_password AS plain_password');
        if (!$spOut || empty($spOut->teacher_no)) {
            return response()->json([
                'success' => false,
                'message' => 'Teacher created but sp_create_teacher outputs were not returned correctly.'
            ], 500);
        }

        $created = $this->teacherBaseQuery()
            ->where('teachers.teacher_no', $spOut->teacher_no)
            ->select($this->teacherSelectColumns())
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Teacher created successfully.',
            'data' => $created,
            'generated' => [
                'teacher_id' => $spOut->teacher_id,
                'plain_password' => $spOut->plain_password
            ]
        ], 201);
    }

    public function updateTeacher(Request $request, $teacher_no)
    {
        $teacherTable = $this->teacherTable();
        $existing = DB::table($teacherTable)->where('teacher_no', $teacher_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Teacher not found.'
            ], 404);
        }

        $rules = [
            'name' => ['required', 'string', 'max:150'],
            'tell' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:150'],
            'gender' => ['nullable', 'string', 'max:15'],
            'hire_date' => ['nullable', 'date'],
            'status' => ['nullable', 'in:Active,Inactive']
        ];

        if ($this->teacherHasColumn('teacher_id')) {
            $rules['teacher_id'] = ['nullable', 'string', 'max:50', Rule::unique($teacherTable, 'teacher_id')->ignore($teacher_no, 'teacher_no')];
        }

        if ($this->userHasColumn('email')) {
            $rules['email'] = ['nullable', 'email', 'max:150', Rule::unique('users', 'email')->ignore($existing->user_id, 'user_id')];
        }

        $payload = $request->validate($rules);

        DB::transaction(function () use ($existing, $payload, $teacher_no, $teacherTable) {
            $userUpdate = ['updated_at' => now()];
            $resolvedTeacherId = null;
            if ($this->teacherHasColumn('teacher_id')) {
                $resolvedTeacherId = trim($payload['teacher_id'] ?? $existing->teacher_id ?? '');
            }

            if ($this->userHasColumn('username') && $resolvedTeacherId) {
                $userUpdate['username'] = $resolvedTeacherId;
            }
            if ($this->userHasColumn('full_name')) {
                $userUpdate['full_name'] = trim($payload['name']);
            }
            if ($this->userHasColumn('phone')) {
                $userUpdate['phone'] = $payload['tell'] ?? null;
            }
            if ($this->userHasColumn('email')) {
                $userUpdate['email'] = $payload['email'] ?? null;
            }
            if ($this->userHasColumn('status')) {
                $userUpdate['status'] = $payload['status'] ?? 'Active';
            }

            DB::table('users')
                ->where('user_id', $existing->user_id)
                ->update($userUpdate);

            $teacherUpdate = ['updated_at' => now()];
            if ($this->teacherHasColumn('teacher_id') && $resolvedTeacherId) $teacherUpdate['teacher_id'] = $resolvedTeacherId;
            if ($this->teacherHasColumn('name')) $teacherUpdate['name'] = trim($payload['name']);
            if ($this->teacherHasColumn('tell')) $teacherUpdate['tell'] = $payload['tell'] ?? null;
            if ($this->teacherHasColumn('email')) $teacherUpdate['email'] = $payload['email'] ?? null;
            if ($this->teacherHasColumn('gender')) $teacherUpdate['gender'] = $payload['gender'] ?? null;
            if ($this->teacherHasColumn('hire_date')) $teacherUpdate['hire_date'] = $payload['hire_date'] ?? null;
            if ($this->teacherHasColumn('status')) $teacherUpdate['status'] = $payload['status'] ?? 'Active';

            DB::table($teacherTable)
                ->where('teacher_no', $teacher_no)
                ->update($teacherUpdate);
        });

        $updated = $this->teacherBaseQuery()
            ->where('teachers.teacher_no', $teacher_no)
            ->select($this->teacherSelectColumns())
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Teacher updated successfully.',
            'data' => $updated
        ]);
    }

    public function deleteTeacher($teacher_no)
    {
        $teacherTable = $this->teacherTable();
        $existing = DB::table($teacherTable)->where('teacher_no', $teacher_no)->first();
        if (!$existing) {
            return response()->json([
                'success' => false,
                'message' => 'Teacher not found.'
            ], 404);
        }

        try {
            DB::transaction(function () use ($existing, $teacher_no, $teacherTable) {
                DB::table($teacherTable)->where('teacher_no', $teacher_no)->delete();
                DB::table('users')->where('user_id', $existing->user_id)->delete();
            });
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete teacher because it is linked to other records.'
            ], 409);
        }

        return response()->json([
            'success' => true,
            'message' => 'Teacher deleted successfully.'
        ]);
    }
}
