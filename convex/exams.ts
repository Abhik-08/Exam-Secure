import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createExam = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    teacherId: v.id("teachers"),
    duration: v.number(),
    questions: v.array(v.object({
      question: v.string(),
      options: v.array(v.string()),
      correctAnswer: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("exams", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const getTeacherExams = query({
  args: { teacherId: v.id("teachers") },
  handler: async (ctx, args) => {
    console.log("Fetching exams for teacher:", args.teacherId);
    return await ctx.db
      .query("exams")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .order("desc")
      .collect();
  },
});

export const getExamById = query({
  args: { examId: v.id("exams") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.examId);
  },
});

export const getExamForStudent = query({
  args: { examId: v.id("exams") },
  handler: async (ctx, args) => {
    const exam = await ctx.db.get(args.examId);
    if (!exam || !exam.isActive) {
      return null;
    }
    
    // Return exam without correct answers for students
    return {
      _id: exam._id,
      title: exam.title,
      description: exam.description,
      duration: exam.duration,
      questions: exam.questions.map(q => ({
        question: q.question,
        options: q.options,
      })),
    };
  },
});

export const submitExam = mutation({
  args: {
    examId: v.id("exams"),
    studentName: v.string(),
    studentEmail: v.optional(v.string()),
    answers: v.array(v.number()),
    warnings: v.number(),
    wasTerminated: v.boolean(),
  },
  handler: async (ctx, args) => {
    const exam = await ctx.db.get(args.examId);
    if (!exam) {
      throw new Error("Exam not found");
    }

    // Calculate score
    let score = 0;
    for (let i = 0; i < exam.questions.length; i++) {
      if (args.answers[i] === exam.questions[i].correctAnswer) {
        score++;
      }
    }

    return await ctx.db.insert("examAttempts", {
      examId: args.examId,
      studentName: args.studentName,
      studentEmail: args.studentEmail,
      answers: args.answers,
      score,
      totalQuestions: exam.questions.length,
      startTime: Date.now() - (exam.duration * 60 * 1000), // Approximate start time
      endTime: Date.now(),
      warnings: args.warnings,
      isCompleted: !args.wasTerminated,
      wasTerminated: args.wasTerminated,
    });
  },
});

export const getExamResults = query({
  args: { examId: v.id("exams") },
  handler: async (ctx, args) => {
    const attempts = await ctx.db
      .query("examAttempts")
      .withIndex("by_exam", (q) => q.eq("examId", args.examId))
      .collect();
    
    const exam = await ctx.db.get(args.examId);
    
    return {
      exam,
      attempts,
      stats: {
        totalAttempts: attempts.length,
        completedAttempts: attempts.filter(a => a.isCompleted).length,
        averageScore: attempts.length > 0 
          ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length 
          : 0,
        highestScore: attempts.length > 0 
          ? Math.max(...attempts.map(a => a.score)) 
          : 0,
      }
    };
  },
});
