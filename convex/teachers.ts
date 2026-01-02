import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createTeacher = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if teacher already exists
    const existingTeacher = await ctx.db
      .query("teachers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    
    if (existingTeacher) {
      throw new Error("Teacher with this email already exists");
    }

    return await ctx.db.insert("teachers", {
      email: args.email,
      name: args.name,
      password: args.password, // In production, hash this password
    });
  },
});

export const loginTeacher = query({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const teacher = await ctx.db
      .query("teachers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    console.log("Login lookup result:", teacher); // Add this line
    if (!teacher || teacher.password !== args.password) {
      return null;
    }
    
    return {
      _id: teacher._id,
      email: teacher.email,
      name: teacher.name,
    };
  },
});
