import React, { useState } from "react";
import { useMutation, useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface TeacherLoginProps {
  onLogin: (teacherId: string) => void;
}

export function TeacherLogin({ onLogin }: TeacherLoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const convex = useConvex();
  const createTeacher = useMutation(api.teachers.createTeacher);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (isLogin) {
        // ✅ Login using Convex query
        const teacher = await convex.query(api.teachers.loginTeacher, {
          email: normalizedEmail,
          password,
        });

        if (teacher) {
          onLogin(teacher._id);
          toast.success("Login successful!");
        } else {
          toast.error("Invalid email or password");
        }
      } else {
        // ✅ Register using Convex mutation
        const teacherId = await createTeacher({
          email: normalizedEmail,
          name,
          password,
        });
        onLogin(teacherId);
        toast.success("Account created successfully!");
      }
    } catch (error) {
      console.error(error);
      toast.error(isLogin ? "Login failed" : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold text-center mb-6">
        {isLogin ? "Teacher Login" : "Create Teacher Account"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Processing..." : isLogin ? "Login" : "Create Account"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          {isLogin ? "Need an account? Sign up" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
}
