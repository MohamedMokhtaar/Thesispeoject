import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useParams } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import AcademicStructure from './pages/AcademicStructure';
import CampusEnvironment from './pages/CampusEnvironment';
import ClassIssueDetails from './pages/ClassIssueDetails';
import ClassIssuesList from './pages/ClassIssuesList';
import ClassManagement from './pages/ClassManagement';
import Dashboard from './pages/Dashboard';
import ExamAppeals from './pages/ExamAppeals';
import ExamMenu from './pages/ExamMenu';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Reporting from './pages/Reporting';
import Settings from './pages/Settings';
import StudentManagement from './pages/StudentManagement';
import TeacherManagement from './pages/TeacherManagement';

const MessagingSupport = () => (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-black">Messaging / Support</h1>
        <p className="mt-2 text-sm text-gray-600">Support conversations and internal communication tools will be shown here.</p>
    </div>
);

const LegacyIssueRedirect = () => {
    const { id } = useParams();
    return <Navigate to={`/class-issues/${id}`} replace />;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />

                <Route
                    element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />

                    <Route
                        path="/student-management"
                        element={
                            <ProtectedRoute allowedRoleName={['Admin', 'SuperAdmin']}>
                                <StudentManagement />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/teacher-management"
                        element={
                            <ProtectedRoute allowedRoleName={['Admin', 'SuperAdmin']}>
                                <TeacherManagement />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/academic-structure"
                        element={
                            <ProtectedRoute allowedRoleName={['Faculty', 'Admin', 'SuperAdmin']}>
                                <AcademicStructure />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="/exam-appeals" element={<ExamAppeals />} />

                    <Route
                        path="/exam-menu"
                        element={
                            <ProtectedRoute allowedRoleName={['HeadOfExam', 'Admin', 'SuperAdmin', 'Faculty', 'Teacher']}>
                                <ExamMenu />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/reporting"
                        element={
                            <ProtectedRoute allowedRoleName={['HeadOfExam', 'Admin', 'SuperAdmin', 'Faculty', 'Teacher']}>
                                <Reporting />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/settings"
                        element={
                            <ProtectedRoute allowedRoleName={['HeadOfExam', 'Admin', 'SuperAdmin', 'Faculty', 'Teacher']}>
                                <Settings />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/class-management"
                        element={
                            <ProtectedRoute allowedRoleName={['Faculty', 'Admin', 'SuperAdmin']}>
                                <ClassManagement />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/class-issues"
                        element={
                            <ProtectedRoute allowedRoleName={['Faculty', 'Admin', 'SuperAdmin']}>
                                <ClassIssuesList />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/class-issues/:id"
                        element={
                            <ProtectedRoute allowedRoleName={['Faculty', 'Admin', 'SuperAdmin']}>
                                <ClassIssueDetails />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/campus-environment"
                        element={
                            <ProtectedRoute allowedRoleName={['Faculty', 'Admin', 'SuperAdmin']}>
                                <CampusEnvironment />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/messaging-support"
                        element={
                            <ProtectedRoute allowedRoleName={['Admin', 'SuperAdmin', 'Faculty']}>
                                <MessagingSupport />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="/dashboard/profile" element={<Navigate to="/profile" replace />} />
                    <Route path="/dashboard/*" element={<Navigate to="/dashboard" replace />} />
                </Route>

                <Route
                    path="/admin/*"
                    element={
                        <ProtectedRoute allowedRoleName={['Admin', 'SuperAdmin']}>
                            <Navigate to="/dashboard" replace />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/hoe/*"
                    element={
                        <ProtectedRoute allowedRoleName="HeadOfExam">
                            <Navigate to="/dashboard" replace />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/faculty/classes"
                    element={
                        <ProtectedRoute allowedRoleName={['Faculty', 'Admin', 'SuperAdmin']}>
                            <Navigate to="/class-management" replace />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/faculty/issues"
                    element={
                        <ProtectedRoute allowedRoleName={['Faculty', 'Admin', 'SuperAdmin']}>
                            <Navigate to="/class-issues" replace />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/faculty/issues/:id"
                    element={
                        <ProtectedRoute allowedRoleName={['Faculty', 'Admin', 'SuperAdmin']}>
                            <LegacyIssueRedirect />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/faculty/coursework"
                    element={
                        <ProtectedRoute allowedRoleName={['Faculty', 'Admin', 'SuperAdmin', 'Teacher']}>
                            <Navigate to="/exam-appeals?tab=coursework-appeal" replace />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/teacher/appeals"
                    element={
                        <ProtectedRoute allowedRoleName="Teacher">
                            <Navigate to="/exam-appeals?tab=coursework-appeal" replace />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/faculty/campus"
                    element={
                        <ProtectedRoute allowedRoleName={['Faculty', 'Admin', 'SuperAdmin']}>
                            <Navigate to="/campus-environment" replace />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/profile"
                    element={
                        <ProtectedRoute allowedRoleName={['Admin', 'SuperAdmin']}>
                            <Navigate to="/profile" replace />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/hoe/profile"
                    element={
                        <ProtectedRoute allowedRoleName="HeadOfExam">
                            <Navigate to="/profile" replace />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/faculty/profile"
                    element={
                        <ProtectedRoute allowedRoleName={['Faculty', 'Admin', 'SuperAdmin']}>
                            <Navigate to="/profile" replace />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/teacher/profile"
                    element={
                        <ProtectedRoute allowedRoleName="Teacher">
                            <Navigate to="/profile" replace />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/faculty/*"
                    element={
                        <ProtectedRoute allowedRoleName={['Faculty', 'Admin', 'SuperAdmin']}>
                            <Navigate to="/dashboard" replace />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/teacher/*"
                    element={
                        <ProtectedRoute allowedRoleName="Teacher">
                            <Navigate to="/dashboard" replace />
                        </ProtectedRoute>
                    }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;

