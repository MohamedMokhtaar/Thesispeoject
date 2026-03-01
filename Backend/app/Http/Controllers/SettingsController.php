<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    public function listCredentials(Request $request)
    {
        $type = strtolower((string) $request->query('type', 'students'));
        $q = trim((string) $request->query('q', ''));
        $like = '%' . $q . '%';
        $allowed = ['students', 'teachers', 'faculty', 'exams'];

        if (!in_array($type, $allowed, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials type.'
            ], 422);
        }

        if ($type === 'students') {
            $rows = DB::table('student_initial_credentials as c')
                ->join('students as s', 'c.std_id', '=', 's.std_id')
                ->when($q !== '', function ($query) use ($like) {
                    $query->where(function ($subQuery) use ($like) {
                        $subQuery->where('s.student_id', 'like', $like)
                            ->orWhere('s.name', 'like', $like)
                            ->orWhere('c.username', 'like', $like);
                    });
                })
                ->select(
                    DB::raw("'students' as type"),
                    'c.cred_no',
                    's.student_id as account_id',
                    's.name as full_name',
                    'c.username',
                    'c.plain_password',
                    'c.created_at'
                )
                ->orderBy('c.cred_no', 'DESC')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $rows
            ]);
        }

        if ($type === 'teachers') {
            $rows = DB::table('teacher_initial_credentials as c')
                ->join('teachers as t', 'c.teacher_no', '=', 't.teacher_no')
                ->when($q !== '', function ($query) use ($like) {
                    $query->where(function ($subQuery) use ($like) {
                        $subQuery->where('t.teacher_id', 'like', $like)
                            ->orWhere('t.name', 'like', $like)
                            ->orWhere('c.username', 'like', $like);
                    });
                })
                ->select(
                    DB::raw("'teachers' as type"),
                    'c.cred_no',
                    't.teacher_id as account_id',
                    't.name as full_name',
                    'c.username',
                    'c.plain_password',
                    'c.created_at'
                )
                ->orderBy('c.cred_no', 'DESC')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $rows
            ]);
        }

        if ($type === 'faculty') {
            $rows = DB::table('users as u')
                ->join('roles as r', 'u.role_id', '=', 'r.role_id')
                ->whereRaw('LOWER(r.role_name) = ?', ['faculty'])
                ->when($q !== '', function ($query) use ($like) {
                    $query->where('u.username', 'like', $like);
                })
                ->select(
                    DB::raw("'faculty' as type"),
                    'u.user_id as cred_no',
                    DB::raw('NULL as account_id'),
                    DB::raw("'Faculty User' as full_name"),
                    'u.username',
                    DB::raw("NULL as plain_password"),
                    'u.created_at'
                )
                ->orderBy('u.user_id', 'DESC')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $rows
            ]);
        }

        $rows = DB::table('users as u')
            ->join('roles as r', 'u.role_id', '=', 'r.role_id')
            ->whereRaw('LOWER(r.role_name) IN (?, ?, ?, ?)', ['headofexam', 'exam', 'exams', 'examofficer'])
            ->when($q !== '', function ($query) use ($like) {
                $query->where('u.username', 'like', $like);
            })
            ->select(
                DB::raw("'exams' as type"),
                'u.user_id as cred_no',
                DB::raw('NULL as account_id'),
                DB::raw("'Exam User' as full_name"),
                'u.username',
                DB::raw("NULL as plain_password"),
                'u.created_at'
            )
            ->orderBy('u.user_id', 'DESC')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rows
        ]);
    }
}
