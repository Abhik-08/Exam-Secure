import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Teacher login endpoint
http.route({
  path: "/api/login",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const { email, password } = await request.json();
    
    const teacher = await ctx.runQuery(api.teachers.loginTeacher, {
      email,
      password,
    });
    
    if (!teacher) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    return new Response(JSON.stringify(teacher), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
