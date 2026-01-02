import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { TeacherLogin } from "./components/TeacherLogin";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { StudentExam } from "./components/StudentExam";
import { Toaster } from "sonner";

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'teacher' | 'student'>('home');
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [examId, setExamId] = useState<string | null>(null);

  // Check if URL contains exam ID for student access
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const examIdFromUrl = urlParams.get('exam');
    if (examIdFromUrl) {
      setExamId(examIdFromUrl);
      setCurrentView('student');
    }
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case 'teacher':
        if (!teacherId) {
          return <TeacherLogin onLogin={setTeacherId} />;
        }
        return <TeacherDashboard teacherId={teacherId} onLogout={() => setTeacherId(null)} />;
      
      case 'student':
        if (!examId) {
          return (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Invalid Exam Link</h2>
              <p className="text-gray-600">Please check your exam link and try again.</p>
            </div>
          );
        }
        return <StudentExam examId={examId} />;
      
      default:
        return (
          <div className="text-center space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Online Exam System</h1>
              <p className="text-xl text-gray-600">Secure, proctored online examinations</p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => setCurrentView('teacher')}
                className="w-full max-w-md mx-auto block bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Teacher Login
              </button>
              
              <div className="text-sm text-gray-500">
                Students: Click on the exam link provided by your teacher
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 
              className="text-2xl font-bold text-blue-600 cursor-pointer"
              onClick={() => {
                setCurrentView('home');
                setTeacherId(null);
                setExamId(null);
                window.history.pushState({}, '', '/');
              }}
            >
              Online Exam System
            </h1>
            
            {currentView !== 'home' && (
              <button
                onClick={() => {
                  setCurrentView('home');
                  setTeacherId(null);
                  setExamId(null);
                  window.history.pushState({}, '', '/');
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Back to Home
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {renderContent()}
      </main>

      <Toaster />
    </div>
  );
}
