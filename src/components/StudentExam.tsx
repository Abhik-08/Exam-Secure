import * as faceapi from "face-api.js";
import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface StudentExamProps {
  examId: string;
}

export function StudentExam({ examId }: StudentExamProps) {
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [warnings, setWarnings] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [noFaceStartTime, setNoFaceStartTime] = useState<number | null>(null);
  const [multiFaceStartTime, setMultiFaceStartTime] = useState<number | null>(null);
  const issueWarning = (message: string) => {
  setWarnings(prev => {
    const newCount = prev + 1;
    toast.warning(`Warning ${newCount}/3: ${message}`);
    
    if (newCount >= 3) {
      toast.error("Exam terminated due to multiple violations!");
      handleSubmitExam(true, true);
    }

    return newCount;
  });
};

  const loadModels = async () => {
  const MODEL_URL = '/models'; // make sure models are hosted at /public/models
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
};

  const [faceDetected, setFaceDetected] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const faceDetectionRef = useRef<NodeJS.Timeout | null>(null);

  const exam = useQuery(api.exams.getExamForStudent, { 
    examId: examId as Id<"exams"> 
  });
  const submitExam = useMutation(api.exams.submitExam);

  useEffect(() => {
    if (exam && hasStarted && timeLeft === 0) {
      setTimeLeft(exam.duration * 60); // Convert minutes to seconds
    }
  }, [exam, hasStarted]);

  useEffect(() => {
    if (hasStarted && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitExam(true); // Auto-submit when time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [hasStarted, timeLeft]);

const startWebcam = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: false 
    });

    streamRef.current = stream;

    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => {
          console.error("Video playback error:", err);
        });
        console.log("✅ Webcam started and video feed attached.");
      }
    }, 100); // Slight delay to ensure videoRef is mounted

    startFaceDetection();
  } catch (error) {
    toast.error("Camera access is required for this exam");
    console.error("Camera access error:", error);
  }
};


  const startFaceDetection = () => {
    faceDetectionRef.current = setInterval(() => {
      detectFaces();
    }, 10000); // Check every 2 seconds
  };

  const detectFaces = async () => {
  if (!videoRef.current || !canvasRef.current) return;

  const detections = await faceapi.detectAllFaces(
    videoRef.current,
    new faceapi.TinyFaceDetectorOptions()
  );

  const faceCount = detections.length;
  setFaceDetected(faceCount === 1);
  const now = Date.now();

  // Handle NO FACE case
  if (faceCount === 0) {
    if (!noFaceStartTime) setNoFaceStartTime(now);
    if (now - (noFaceStartTime ?? 0) >= 30000) {
      issueWarning("No face detected!");
      setNoFaceStartTime(null); // Reset
    }
  } else {
    setNoFaceStartTime(null); // Reset if face appears again
  }

  // Handle MULTIPLE FACES case
  if (faceCount > 1) {
    if (!multiFaceStartTime) setMultiFaceStartTime(now);
    if (now - (multiFaceStartTime ?? 0) >= 30000) {
      issueWarning("Multiple faces detected!");
      setMultiFaceStartTime(null); // Reset
    }
  } else {
    setMultiFaceStartTime(null); // Reset if only one face
  }
};



  const handleStartExam = async () => {
  if (!studentName.trim()) {
    toast.error("Please enter your name");
    return;
  }

  await loadModels(); // <- load face-api.js models
  await startWebcam();
  setHasStarted(true);

  if (exam) {
    setAnswers(new Array(exam.questions.length).fill(-1));
  }
};


  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleSubmitExam = async (autoSubmit = false, wasTerminated = false) => {
    if (!exam) return;

    try {
      const result = await submitExam({
        examId: examId as Id<"exams">,
        studentName,
        studentEmail: studentEmail || undefined,
        answers,
        warnings,
        wasTerminated,
      });

      // Calculate score for display (this would normally come from the backend)
      let calculatedScore = 0;
      // Note: We can't calculate the actual score here since we don't have correct answers
      // In a real implementation, the score would be returned from the backend
      
      setScore(calculatedScore);
      setIsCompleted(true);
      setShowResults(true);

      // Stop webcam and intervals
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (faceDetectionRef.current) {
        clearInterval(faceDetectionRef.current);
      }

      if (wasTerminated) {
        toast.error("Exam has been terminated due to violations");
      } else {
        toast.success("Exam submitted successfully!");
      }
    } catch (error) {
      toast.error("Failed to submit exam");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!exam) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Exam Not Found</h2>
        <p className="text-gray-600">The exam link may be invalid or the exam may have been deactivated.</p>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <h2 className="text-3xl font-bold text-green-600 mb-4">Exam Completed!</h2>
        <div className="space-y-4">
          <p className="text-xl">Thank you, <strong>{studentName}</strong></p>
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Exam Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Questions:</p>
                <p className="font-semibold">{exam.questions.length}</p>
              </div>
              <div>
                <p className="text-gray-600">Warnings Received:</p>
                <p className="font-semibold text-red-600">{warnings}/3</p>
              </div>
              <div>
                <p className="text-gray-600">Status:</p>
                <p className="font-semibold text-green-600">
                  {isCompleted ? "Completed" : "Terminated"}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Submitted At:</p>
                <p className="font-semibold">{new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
          <p className="text-gray-600">
            Your results will be reviewed and shared by your instructor.
          </p>
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{exam.title}</h2>
        <p className="text-gray-600 mb-6">{exam.description}</p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">Important Instructions:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Your webcam will be monitored throughout the exam</li>
            <li>• Ensure you are alone in the room</li>
            <li>• Keep your face visible at all times</li>
            <li>• You will receive warnings for violations</li>
            <li>• 3 warnings will result in exam termination</li>
            <li>• Duration: {exam.duration} minutes</li>
            <li>• Total Questions: {exam.questions.length}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (Optional)
            </label>
            <input
              type="email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            
            
            onClick={handleStartExam}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-semibold"
          >
            Start Exam
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with timer and warnings */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{exam.title}</h2>
          <p className="text-sm text-gray-600">
            Question {currentQuestion + 1} of {exam.questions.length}
          </p>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Warnings</p>
            <p className={`text-lg font-bold ${warnings >= 2 ? 'text-red-600' : 'text-yellow-600'}`}>
              {warnings}/3
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">Time Left</p>
            <p className={`text-lg font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-blue-600'}`}>
              {formatTime(timeLeft)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main exam area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Question */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">
              {exam.questions[currentQuestion].question}
            </h3>
            
            <div className="space-y-3">
              {exam.questions[currentQuestion].options.map((option, index) => (
                <label
                  key={index}
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="answer"
                    value={index}
                    checked={answers[currentQuestion] === index}
                    onChange={() => handleAnswerSelect(index)}
                    className="text-blue-600"
                  />
                  <span className="flex-1">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex space-x-2">
              {currentQuestion < exam.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={() => handleSubmitExam()}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold"
                >
                  Submit Exam
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar with webcam and question navigator */}
        <div className="space-y-6">
          {/* Webcam */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h4 className="font-semibold mb-2">Proctoring</h4>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-48 rounded-md bg-black object-cover"
              style={{ maxHeight: '200px' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <p className="text-xs text-gray-500 mt-2">
              Keep your face visible at all times
            </p>
          </div>

          {/* Question Navigator */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h4 className="font-semibold mb-2">Questions</h4>
            <div className="grid grid-cols-5 gap-2">
              {exam.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-8 h-8 rounded text-sm font-medium ${
                    index === currentQuestion
                      ? 'bg-blue-600 text-white'
                      : answers[index] !== -1
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <div className="mt-3 text-xs space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                <span>Not answered</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
