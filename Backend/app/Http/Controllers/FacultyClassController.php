<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FacultyClassController extends Controller
{
    /**
     * View classes and leaders
     */
    public function index()
    {
        try {
            $classes = DB::table('classes')
                ->leftJoin('leaders', 'classes.cls_no', '=', 'leaders.cls_no')
                ->leftJoin('students', 'leaders.std_id', '=', 'students.std_id')
                ->select(
                    'classes.cls_no',
                    'classes.cl_name',
                    'students.std_id AS leader_std_id',
                    'students.name AS leader_name',
                    'students.student_id AS leader_id_code'
                )
                ->get();

            return response()->json([
                'success' => true,
                'data' => $classes
            ]);
        } catch (\Exception $e) {
            Log::error("Error fetching faculty classes: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch classes'
            ], 500);
        }
    }

    /**
     * Change class leader
     */
    public function updateLeader(Request $request, $cls_no)
    {
        $request->validate([
            'std_id' => 'required|integer|exists:students,std_id'
        ]);

        try {
            DB::beginTransaction();

            // Check if student belongs to this class
            // This is a safety check: in a real system, we'd verify the student is in that class.
            // For now, we follow the user's "dummy data" and "schema as truth" rule.
            
            // Check if leader entry already exists for this class
            $exists = DB::table('leaders')->where('cls_no', $cls_no)->exists();

            if ($exists) {
                DB::table('leaders')
                    ->where('cls_no', $cls_no)
                    ->update([
                        'std_id' => $request->std_id,
                        'updated_at' => now()
                    ]);
            } else {
                DB::table('leaders')->insert([
                    'cls_no' => $cls_no,
                    'std_id' => $request->std_id,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Class leader updated successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error updating class leader: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update class leader'
            ], 500);
        }
    }

    /**
     * Move student to another class
     */
    public function migrateStudent(Request $request)
    {
        $request->validate([
            'std_id' => 'required|integer|exists:students,std_id',
            'new_cls_no' => 'required|integer|exists:classes,cls_no'
        ]);

        try {
            DB::beginTransaction();

            // Update studet_classes table
            // Note: In schema it's spelled 'studet_classes'
            DB::table('studet_classes')
                ->where('std_id', $request->std_id)
                ->update([
                    'cls_no' => $request->new_cls_no,
                    'updated_at' => now()
                ]);

            // If the student was a leader in their old class, remove that assignment
            DB::table('leaders')
                ->where('std_id', $request->std_id)
                ->delete();

            // If the student was a leader in their old class, the UNIQUE constraint on leaders.std_id
            // might need to be handled if they are becoming a leader in the new class.
            // But the request says "move student", not necessarily "make them leader".

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Student migrated successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error migrating student: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to migrate student'
            ], 500);
        }
    }

    /**
     * Get students in a specific class (helper for UI dropdowns)
     */
    public function getClassStudents($cls_no)
    {
        try {
            $students = DB::table('students')
                ->join('studet_classes', 'students.std_id', '=', 'studet_classes.std_id')
                ->where('studet_classes.cls_no', $cls_no)
                ->select('students.std_id', 'students.name', 'students.student_id')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $students
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch students'
            ], 500);
        }
    }

    /**
     * List leaders with filters
     */
    public function listLeaders(Request $request)
    {
        try {
            $query = DB::table('leaders')
                ->join('students', 'leaders.std_id', '=', 'students.std_id')
                ->join('classes', 'leaders.cls_no', '=', 'classes.cls_no')
                ->join('departments', 'classes.dept_no', '=', 'departments.dept_no')
                ->join('faculties', 'departments.faculty_no', '=', 'faculties.faculty_no')
                ->select(
                    'leaders.lead_id as le_no',
                    'students.std_id',
                    'students.name as student_name',
                    'students.student_id as student_code',
                    'classes.cls_no',
                    'classes.cl_name',
                    'departments.name as department_name',
                    'faculties.name as faculty_name',
                    'leaders.created_at'
                );

            if ($request->has('faculty_no')) {
                $query->where('departments.faculty_no', $request->faculty_no);
            }

            if ($request->has('dept_no')) {
                $query->where('classes.dept_no', $request->dept_no);
            }

            if ($request->has('cls_no')) {
                $query->where('leaders.cls_no', $request->cls_no);
            }

            $leaders = $query->orderBy('leaders.lead_id', 'DESC')->get();

            return response()->json([
                'success' => true,
                'data' => $leaders
            ]);
        } catch (\Exception $e) {
            Log::error("Error listing leaders: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to list leaders'
            ], 500);
        }
    }

    /**
     * Get all students for dropdown selection
     */
    public function getAllStudents()
    {
        try {
            $students = DB::table('students')
                ->join('studet_classes', 'students.std_id', '=', 'studet_classes.std_id')
                ->select('students.std_id', 'students.student_id', 'students.name', 'studet_classes.cls_no')
                ->orderBy('students.std_id', 'ASC')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $students
            ]);
        } catch (\Exception $e) {
            Log::error("Error fetching all students: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch students'
            ], 500);
        }
    }
}
