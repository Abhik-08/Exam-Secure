import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CreateExam } from "./CreateExam";
import { ExamResults } from "./ExamResults";
import { Id } from "../../convex/_generated/dataModel";

interface TeacherDashboardProps {
  teacherId: string;
  onLogout: () => void;
}

export function TeacherDashboard({ teacherId, onLogout }: TeacherDashboardProps) {
  const [currentView, setCurrentView] = useState<'dashboard' | 'create' | 'results'>('dashboard');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  const exams = useQuery(api.exams.getTeacherExams, { 
    teacherId: teacherId as Id<"teachers"> 
  });

  const copyExamLink = (examId: string) => {
    const link = `${window.location.origin}?exam=${examId}`;
    navigator.clipboard.writeText(link);
    alert("Exam link copied to clipboard!");
  };

  const renderContent = () => {
    switch (currentView) {
      case 'create':
        return (
          <CreateExam 
            teacherId={teacherId as Id<"teachers">} 
            onBack={() => setCurrentView('dashboard')} 
          />
        );
      
      case 'results':
        return selectedExamId ? (
          <ExamResults 
            examId={selectedExamId as Id<"exams">} 
            onBack={() => setCurrentView('dashboard')} 
          />
        ) : null;
      
      default:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">My Exams</h2>
              <button
                onClick={() => setCurrentView('create')}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Create New Exam
              </button>
            </div>

            {exams === undefined ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : exams.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500 text-lg">No exams created yet</p>
                <button
                  onClick={() => setCurrentView('create')}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Your First Exam
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {exams.map((exam) => (
                  <div key={exam._id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                          {exam.title}
                        </h3>
                        <p className="text-gray-600 mb-2">{exam.description}</p>
                        <div className="text-sm text-gray-500 space-y-1">
                          <p>Duration: {exam.duration} minutes</p>
                          <p>Questions: {exam.questions.length}</p>
                          <p>Created: {new Date(exam.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-4">
                        <button
                          onClick={() => copyExamLink(exam._id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                          Copy Link
                        </button>
                        <button
                          onClick={() => {
                            setSelectedExamId(exam._id);
                            setCurrentView('results');
                          }}
                          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm"
                        >
                          View Results
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Teacher Dashboard</h1>
        <button
          onClick={onLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>

      {renderContent()}
    </div>
  );
}
