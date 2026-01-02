import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  teachers: defineTable({
    email: v.string(),
    name: v.string(),
    password: v.string(),
  }).index("by_email", ["email"]),

  exams: defineTable({
    title: v.string(),
    description: v.string(),
    teacherId: v.id("teachers"),
    duration: v.number(), // in minutes
    questions: v.array(v.object({
      question: v.string(),
      options: v.array(v.string()),
      correctAnswer: v.number(), // index of correct option
    })),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_teacher", ["teacherId"]),

  examAttempts: defineTable({
    examId: v.id("exams"),
    studentName: v.string(),
    studentEmail: v.optional(v.string()),
    answers: v.array(v.number()), // array of selected option indices
    score: v.number(),
    totalQuestions: v.number(),
    startTime: v.number(),
    endTime: v.number(),
    warnings: v.number(),
    isCompleted: v.boolean(),
    wasTerminated: v.boolean(),
  }).index("by_exam", ["examId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
