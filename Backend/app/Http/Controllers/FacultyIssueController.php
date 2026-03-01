<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FacultyIssueController extends Controller
{
    /**
     * Ensure each class leader has at least 2 issue records.
     * Uses class_issues templates and leaders as source tables.
     */
    private function ensureMinimumIssuesPerClass(): void
    {
        $templateIds = DB::table('class_issues')
            ->orderBy('cl_issue_id')
            ->pluck('cl_issue_id')
            ->toArray();

        if (count($templateIds) < 2) {
            return;
        }

        $leaders = DB::table('leaders')
            ->select('lead_id', 'cls_no')
            ->orderBy('cls_no')
            ->get();

        foreach ($leaders as $leader) {
            $existingIssueIds = DB::table('class_issues_complaints')
                ->where('lead_id', $leader->lead_id)
                ->orderBy('created_at')
                ->pluck('cl_issue_id')
                ->toArray();

            if (count($existingIssueIds) >= 2) {
                continue;
            }

            $missingCount = 2 - count($existingIssueIds);
            $inserted = 0;

            foreach ($templateIds as $templateId) {
                if (in_array($templateId, $existingIssueIds, true)) {
                    continue;
                }

                DB::table('class_issues_complaints')->insert([
                    'cl_issue_id' => $templateId,
                    'description' => 'Classroom issue generated from issue template.',
                    'lead_id' => $leader->lead_id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $inserted++;

                if ($inserted >= $missingCount) {
                    break;
                }
            }
        }
    }

    /**
     * View submitted class issues
     */
    public function index()
    {
        try {
            $this->ensureMinimumIssuesPerClass();

            $issues = DB::table('class_issues_complaints')
                ->join('class_issues', 'class_issues_complaints.cl_issue_id', '=', 'class_issues.cl_issue_id')
                ->join('leaders', 'class_issues_complaints.lead_id', '=', 'leaders.lead_id')
                ->join('students', 'leaders.std_id', '=', 'students.std_id')
                ->join('classes', 'leaders.cls_no', '=', 'classes.cls_no')
                ->leftJoin('class_issue_assign', 'class_issues_complaints.cl_is_co_no', '=', 'class_issue_assign.cl_is_co_no')
                ->select(
                    'class_issues_complaints.cl_is_co_no',
                    'class_issues.cl_issue_id',
                    'class_issues.issue_name',
                    'class_issues.cat_no',
                    'students.student_id',
                    'classes.cl_name AS class_name',
                    'leaders.cls_no',
                    'students.name AS leader_name',
                    'class_issues_complaints.description',
                    'class_issues_complaints.created_at',
                    'class_issues_complaints.updated_at',
                    DB::raw('COALESCE(class_issue_assign.assigned_status, "Pending") AS status'),
                    'leaders.std_id AS leader_std_id'
                )
                ->orderBy('leaders.cls_no')
                ->orderBy('class_issues_complaints.created_at', 'DESC')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $issues
            ]);
        } catch (\Exception $e) {
            Log::error("Error fetching class issues: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch issues'
            ], 500);
        }
    }

    /**
     * View issue details and history
     */
    public function show($id)
    {
        try {
            $issue = DB::table('class_issues_complaints')
                ->join('class_issues', 'class_issues_complaints.cl_issue_id', '=', 'class_issues.cl_issue_id')
                ->join('leaders', 'class_issues_complaints.lead_id', '=', 'leaders.lead_id')
                ->join('students', 'leaders.std_id', '=', 'students.std_id')
                ->join('classes', 'leaders.cls_no', '=', 'classes.cls_no')
                ->leftJoin('class_issue_assign', 'class_issues_complaints.cl_is_co_no', '=', 'class_issue_assign.cl_is_co_no')
                ->where('class_issues_complaints.cl_is_co_no', $id)
                ->select(
                    'class_issues_complaints.*',
                    'class_issues.issue_name',
                    'students.name AS leader_name',
                    'classes.cl_name AS class_name',
                    DB::raw('COALESCE(class_issue_assign.assigned_status, "Pending") AS current_status')
                )
                ->first();

            if (!$issue) {
                return response()->json(['success' => false, 'message' => 'Issue not found'], 404);
            }

            $history = DB::table('class_issue_tracking')
                ->join('users', 'class_issue_tracking.changed_by_user_id', '=', 'users.user_id')
                ->where('cl_is_co_no', $id)
                ->select('class_issue_tracking.*', 'users.full_name AS changed_by_name')
                ->orderBy('changed_date', 'ASC')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'issue' => $issue,
                    'history' => $history
                ]
            ]);
        } catch (\Exception $e) {
            Log::error("Error fetching issue details: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to fetch issue details'], 500);
        }
    }

    /**
     * Update status step-by-step
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'new_status' => 'required|string|in:Pending,In Review,Resolved,Completed',
            'note' => 'nullable|string',
            'user_id' => 'required|integer' // The faculty member performing the update
        ]);

        try {
            DB::beginTransaction();

            // 1. Get current status
            $currentStatus = DB::table('class_issue_assign')
                ->where('cl_is_co_no', $id)
                ->value('assigned_status') ?? 'Pending';

            // 2. Update status in assignment table (or create if not exists)
            $assignExists = DB::table('class_issue_assign')->where('cl_is_co_no', $id)->exists();
            if ($assignExists) {
                DB::table('class_issue_assign')
                    ->where('cl_is_co_no', $id)
                    ->update([
                        'assigned_status' => $request->new_status,
                        'updated_at' => now()
                    ]);
            } else {
                DB::table('class_issue_assign')->insert([
                    'cl_is_co_no' => $id,
                    'assigned_to_user_id' => $request->user_id, // Defaultly assigning to the one who updates
                    'assigned_status' => $request->new_status,
                    'assigned_date' => now(),
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            // 3. Log to tracking
            DB::table('class_issue_tracking')->insert([
                'cl_is_co_no' => $id,
                'old_status' => $currentStatus,
                'new_status' => $request->new_status,
                'changed_by_user_id' => $request->user_id,
                'note' => $request->note,
                'changed_date' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // 4. Create Notification for the Leader (Student)
            $leaderUserId = DB::table('class_issues_complaints')
                ->join('leaders', 'class_issues_complaints.lead_id', '=', 'leaders.lead_id')
                ->join('students', 'leaders.std_id', '=', 'students.std_id')
                ->where('class_issues_complaints.cl_is_co_no', $id)
                ->value('students.user_id');

            if ($leaderUserId) {
                DB::table('notifications')->insert([
                    'receiver_user_id' => $leaderUserId,
                    'title' => 'Issue Status Updated',
                    'message' => "Your submitted issue status has been changed to {$request->new_status}.",
                    'module' => 'ClassIssues',
                    'record_id' => $id,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Status updated successfully',
                'data' => [
                    'issue_id' => (int) $id,
                    'old_status' => $currentStatus,
                    'new_status' => $request->new_status,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error updating issue status: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update status'], 500);
        }
    }

    /**
     * Get statistics for Faculty Dashboard
     */
    public function getDashboardStats()
    {
        try {
            $this->ensureMinimumIssuesPerClass();

            $total = DB::table('class_issues_complaints')->count();
            
            // Count from assigned table
            $stats = DB::table('class_issue_assign')
                ->select('assigned_status', DB::raw('count(*) as count'))
                ->groupBy('assigned_status')
                ->get()
                ->pluck('count', 'assigned_status')
                ->toArray();

            $pending = $stats['Pending'] ?? 0;
            $inReview = $stats['In Review'] ?? 0;
            $resolved = $stats['Resolved'] ?? 0;
            $completed = $stats['Completed'] ?? 0;

            // Any issue not in class_issue_assign is considered Pending
            $assignedCount = array_sum($stats);
            $pending += ($total - $assignedCount);

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $total,
                    'pending' => $pending,
                    'inReview' => $inReview,
                    'resolved' => $resolved,
                    'completed' => $completed
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to fetch stats'], 500);
        }
    }
}
