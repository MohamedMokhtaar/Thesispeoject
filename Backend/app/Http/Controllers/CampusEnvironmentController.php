<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CampusEnvironmentController extends Controller
{
    private function normalizeStatus(string $status): string
    {
        $value = strtolower(trim($status));

        if (in_array($value, ['pending', 'in processing', 'processing'])) {
            return 'Pending';
        }

        if ($value === 'in review') {
            return 'In Review';
        }

        if (in_array($value, ['resolved', 'reject', 'rejected'])) {
            return 'Resolved';
        }

        if ($value === 'completed') {
            return 'Completed';
        }

        return 'Pending';
    }

    /**
     * List campus environment complaints.
     */
    public function complaints(Request $request)
    {
        try {
            $statusExpr = 'CASE
                WHEN campus_env_assign.assigned_status IS NULL THEN "Pending"
                WHEN LOWER(campus_env_assign.assigned_status) IN ("pending", "in processing", "processing") THEN "Pending"
                WHEN LOWER(campus_env_assign.assigned_status) IN ("in review") THEN "In Review"
                WHEN LOWER(campus_env_assign.assigned_status) IN ("resolved", "reject", "rejected") THEN "Resolved"
                WHEN LOWER(campus_env_assign.assigned_status) IN ("completed") THEN "Completed"
                ELSE "Pending"
            END';

            $latestStudentClass = DB::table('studet_classes')
                ->select('std_id', DB::raw('MAX(sc_no) as latest_sc_no'))
                ->groupBy('std_id');

            $query = DB::table('campus_envo_complaints')
                ->join('campus_enviroment', 'campus_envo_complaints.camp_env_no', '=', 'campus_enviroment.camp_env_no')
                ->join('students', 'campus_envo_complaints.std_id', '=', 'students.std_id')
                ->leftJoinSub($latestStudentClass, 'latest_student_class', function ($join) {
                    $join->on('students.std_id', '=', 'latest_student_class.std_id');
                })
                ->leftJoin('studet_classes as current_sc', 'latest_student_class.latest_sc_no', '=', 'current_sc.sc_no')
                ->leftJoin('classes', 'current_sc.cls_no', '=', 'classes.cls_no')
                ->leftJoin('categories', 'campus_enviroment.cat_no', '=', 'categories.cat_no')
                ->leftJoin('campus_env_assign', 'campus_envo_complaints.cmp_env_com_no', '=', 'campus_env_assign.cmp_env_com_no')
                ->select(
                    'campus_envo_complaints.cmp_env_com_no',
                    'campus_enviroment.camp_env_no',
                    'students.student_id',
                    'classes.cl_name as class_name',
                    'students.name as name',
                    'campus_enviroment.campuses_issues as issue_name',
                    'campus_enviroment.campuses_issues',
                    'campus_enviroment.cat_no',
                    'campus_envo_complaints.description',
                    'campus_envo_complaints.images',
                    'campus_envo_complaints.created_at as date',
                    'categories.cat_name as category_name',
                    DB::raw("{$statusExpr} as status"),
                    'campus_envo_complaints.updated_at'
                );

            if ($request->filled('status')) {
                $query->whereRaw("{$statusExpr} = ?", [$request->status]);
            }

            $complaints = $query
                ->orderBy('campus_envo_complaints.created_at', 'DESC')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $complaints
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching campus environment complaints: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch campus environment complaints'
            ], 500);
        }
    }

    /**
     * List campus environment tracking history.
     */
    public function tracking(Request $request)
    {
        try {
            $statusExpr = 'CASE
                WHEN campus_env_assign.assigned_status IS NULL THEN "Pending"
                WHEN LOWER(campus_env_assign.assigned_status) IN ("pending", "in processing", "processing") THEN "Pending"
                WHEN LOWER(campus_env_assign.assigned_status) IN ("in review") THEN "In Review"
                WHEN LOWER(campus_env_assign.assigned_status) IN ("resolved", "reject", "rejected") THEN "Resolved"
                WHEN LOWER(campus_env_assign.assigned_status) IN ("completed") THEN "Completed"
                ELSE "Pending"
            END';

            $changeStatusExpr = 'CASE
                WHEN campus_env_tracking.new_status IS NULL THEN NULL
                WHEN LOWER(campus_env_tracking.new_status) IN ("pending", "in processing", "processing") THEN "Pending"
                WHEN LOWER(campus_env_tracking.new_status) IN ("in review") THEN "In Review"
                WHEN LOWER(campus_env_tracking.new_status) IN ("resolved", "reject", "rejected") THEN "Resolved"
                WHEN LOWER(campus_env_tracking.new_status) IN ("completed") THEN "Completed"
                ELSE "Pending"
            END';

            $latestTracking = DB::table('campus_env_tracking')
                ->select('cmp_env_com_no', DB::raw('MAX(cet_no) as latest_cet_no'))
                ->groupBy('cmp_env_com_no');

            $latestStudentClass = DB::table('studet_classes')
                ->select('std_id', DB::raw('MAX(sc_no) as latest_sc_no'))
                ->groupBy('std_id');

            $query = DB::table('campus_env_tracking')
                ->joinSub($latestTracking, 'latest_tracking', function ($join) {
                    $join->on('campus_env_tracking.cmp_env_com_no', '=', 'latest_tracking.cmp_env_com_no')
                        ->on('campus_env_tracking.cet_no', '=', 'latest_tracking.latest_cet_no');
                })
                ->join('campus_envo_complaints', 'campus_env_tracking.cmp_env_com_no', '=', 'campus_envo_complaints.cmp_env_com_no')
                ->join('campus_enviroment', 'campus_envo_complaints.camp_env_no', '=', 'campus_enviroment.camp_env_no')
                ->join('students', 'campus_envo_complaints.std_id', '=', 'students.std_id')
                ->leftJoinSub($latestStudentClass, 'latest_student_class', function ($join) {
                    $join->on('students.std_id', '=', 'latest_student_class.std_id');
                })
                ->leftJoin('studet_classes as current_sc', 'latest_student_class.latest_sc_no', '=', 'current_sc.sc_no')
                ->leftJoin('classes', 'current_sc.cls_no', '=', 'classes.cls_no')
                ->leftJoin('campus_env_assign', 'campus_env_tracking.cmp_env_com_no', '=', 'campus_env_assign.cmp_env_com_no')
                ->select(
                    'campus_env_tracking.cet_no',
                    'campus_env_tracking.cmp_env_com_no',
                    'students.student_id',
                    'classes.cl_name as class_name',
                    'students.name as name',
                    'campus_enviroment.campuses_issues as issue_name',
                    'campus_enviroment.campuses_issues',
                    'campus_enviroment.cat_no',
                    'campus_envo_complaints.description',
                    'campus_envo_complaints.images',
                    DB::raw("{$statusExpr} as status"),
                    DB::raw("{$changeStatusExpr} as change_status"),
                    'campus_env_tracking.changed_date as date'
                );

            if ($request->filled('cmp_env_com_no')) {
                $query->where('campus_env_tracking.cmp_env_com_no', $request->cmp_env_com_no);
            }

            $tracking = $query
                ->orderBy('campus_env_tracking.changed_date', 'DESC')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $tracking
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching campus environment tracking: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch campus environment tracking'
            ], 500);
        }
    }

    /**
     * List support students for a complaint.
     */
    public function supportStudents($cmp_env_com_no)
    {
        try {
            $supporters = DB::table('campus_env_support')
                ->join('students', 'campus_env_support.std_id', '=', 'students.std_id')
                ->where('campus_env_support.cmp_env_com_no', $cmp_env_com_no)
                ->select(
                    'students.std_id',
                    'students.student_id',
                    'students.name',
                    'campus_env_support.supported_at'
                )
                ->orderBy('campus_env_support.supported_at', 'DESC')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $supporters
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching campus environment support students: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch support students'
            ], 500);
        }
    }

    /**
     * Update complaint status.
     */
    public function updateStatus(Request $request, $cmp_env_com_no)
    {
        $request->validate([
            'new_status' => 'required|string|in:Pending,In Review,Resolved,Completed,Reject,In Processing',
            'user_id' => 'nullable|integer'
        ]);

        try {
            DB::beginTransaction();

            $exists = DB::table('campus_envo_complaints')
                ->where('cmp_env_com_no', $cmp_env_com_no)
                ->exists();

            if (!$exists) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Complaint not found.'
                ], 404);
            }

            $newStatus = $this->normalizeStatus($request->new_status);
            $current = DB::table('campus_env_assign')
                ->where('cmp_env_com_no', $cmp_env_com_no)
                ->value('assigned_status');

            $oldStatus = $this->normalizeStatus((string) ($current ?? 'In Processing'));
            $userId = (int) ($request->user_id ?? 13);

            $assignExists = DB::table('campus_env_assign')
                ->where('cmp_env_com_no', $cmp_env_com_no)
                ->exists();

            if ($assignExists) {
                DB::table('campus_env_assign')
                    ->where('cmp_env_com_no', $cmp_env_com_no)
                    ->update([
                        'assigned_status' => $newStatus,
                        'updated_at' => now()
                    ]);
            } else {
                DB::table('campus_env_assign')->insert([
                    'cmp_env_com_no' => $cmp_env_com_no,
                    'assigned_to_user_id' => $userId,
                    'assigned_date' => now(),
                    'assigned_status' => $newStatus,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            DB::table('campus_env_tracking')->insert([
                'cmp_env_com_no' => $cmp_env_com_no,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'changed_by_user_id' => $userId,
                'note' => $request->input('note'),
                'changed_date' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Status updated successfully.',
                'data' => [
                    'cmp_env_com_no' => (int) $cmp_env_com_no,
                    'old_status' => $oldStatus,
                    'new_status' => $newStatus
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating campus environment status: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update status'
            ], 500);
        }
    }
}
