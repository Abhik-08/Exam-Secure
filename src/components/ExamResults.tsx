import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ExamResultsProps {
  examId: Id<"exams">;
  onBack: () => void;
}

export function ExamResults({ examId, onBack }: ExamResultsProps) {
  const results = useQuery(api.exams.getExamResults, { examId });

  if (!results) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  const { exam, attempts, stats } = results;

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 mr-4"
        >
          ← Back to Dashboard
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Exam Results: {exam?.title}</h2>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-2xl font-bold text-blue-600">{stats.totalAttempts}</h3>
          <p className="text-gray-600">Total Attempts</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-2xl font-bold text-green-600">{stats.completedAttempts}</h3>
          <p className="text-gray-600">Completed</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-2xl font-bold text-purple-600">
            {stats.averageScore.toFixed(1)}
          </h3>
          <p className="text-gray-600">Average Score</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-2xl font-bold text-orange-600">{stats.highestScore}</h3>
          <p className="text-gray-600">Highest Score</p>
        </div>
      </div>

      {/* Attempts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Student Attempts</h3>
        </div>
        
        {attempts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No attempts yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attempts.map((attempt) => (
                  <tr key={attempt._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {attempt.studentName}
                        </div>
                        {attempt.studentEmail && (
                          <div className="text-sm text-gray-500">
                            {attempt.studentEmail}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attempt.score}/{attempt.totalQuestions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {((attempt.score / attempt.totalQuestions) * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${
                        attempt.warnings >= 2 ? 'text-red-600' : 
                        attempt.warnings >= 1 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {attempt.warnings}/3
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        attempt.wasTerminated 
                          ? 'bg-red-100 text-red-800'
                          : attempt.isCompleted
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {attempt.wasTerminated ? 'Terminated' : 
                         attempt.isCompleted ? 'Completed' : 'In Progress'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(attempt.endTime).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Exam Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Exam Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Duration:</p>
            <p className="font-semibold">{exam?.duration} minutes</p>
          </div>
          <div>
            <p className="text-gray-600">Total Questions:</p>
            <p className="font-semibold">{exam?.questions.length}</p>
          </div>
          <div>
            <p className="text-gray-600">Created:</p>
            <p className="font-semibold">
              {exam?.createdAt ? new Date(exam.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Status:</p>
            <p className="font-semibold text-green-600">
              {exam?.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
