# How to Use the Claude AI Project Scaffold Prompt

## 📖 Overview

This prompt template is designed to help you quickly scaffold new web development projects using Claude AI, based on the successful patterns and design system from your Krishi-Seer project.

## 🎯 What This Prompt Does

The prompt instructs Claude to:
1. Create a complete project structure with modern tech stack
2. Design a beautiful, modern UI (better than your current project)
3. Set up all necessary configuration files
4. Provide a step-by-step implementation workflow

## 🚀 How to Use

### Step 1: Customize the Prompt
Open `CLAUDE_PROJECT_SCAFFOLD_PROMPT.md` and fill in:

1. **Your Problem Statement** (Line 5)
   ```
   **[INSERT YOUR PROBLEM STATEMENT HERE]**
   ```
   Example: "A fitness tracking app that helps users log workouts, track nutrition, and connect with personal trainers"

2. **Your Specific APIs** (Line 44)
   ```
   - **[INSERT YOUR SPECIFIC APIs HERE]**
   ```
   Example:
   - OpenAI API for workout recommendations
   - Stripe API for subscription payments
   - Twilio API for SMS notifications

3. **Core Features** (Line 145)
   ```
   1. **[Feature 1]** - Description
   ```
   Example:
   1. **Workout Logging** - Users can log exercises, sets, reps, and weight
   2. **Nutrition Tracking** - Calorie and macro tracking with barcode scanning
   3. **Progress Analytics** - Visual charts showing fitness progress over time

4. **Database Schema** (Line 160)
   ```
   - **[Table 1]**: Fields and relationships
   ```
   Example:
   - **users**: id, email, name, fitness_goals, created_at
   - **workouts**: id, user_id, date, duration, exercises[]
   - **nutrition_logs**: id, user_id, date, meals[], total_calories

5. **API Endpoints** (Line 165)
   ```
   - **POST /api/[endpoint-1]**: Description
   ```
   Example:
   - **POST /api/workouts**: Create a new workout log
   - **GET /api/analytics**: Get user fitness analytics
   - **POST /api/ai-recommendations**: Get AI-powered workout suggestions

6. **Pages Required** (Line 170)
   ```
   3. **[Feature Page 1]** (`/[route-1]`): Description
   ```
   Example:
   3. **Workout Logger** (`/workouts`): Log and view workout history
   4. **Nutrition Tracker** (`/nutrition`): Track daily meals and calories
   5. **Analytics** (`/analytics`): View progress charts and insights

### Step 2: Copy and Send to Claude
1. Open a new conversation with Claude AI
2. Copy the **entire customized prompt** from `CLAUDE_PROJECT_SCAFFOLD_PROMPT.md`
3. Paste it into Claude
4. Send the message

### Step 3: Review the Scaffold
Claude will provide:
- Complete folder structure
- package.json with dependencies
- Configuration files
- Database schema
- API specifications
- README template

### Step 4: Request Code Step-by-Step
After receiving the scaffold, request code for each component/page:

**Example requests:**
```
"Give me the code for /app/layout.tsx"
"Give me the code for /components/ui/button.tsx"
"Give me the code for /app/page.tsx (landing page)"
"Give me the code for /app/dashboard/page.tsx"
"Give me the code for /app/api/workouts/route.ts"
```

### Step 5: Implement and Test
1. Create the files as Claude provides them
2. Test each component
3. Request modifications if needed
4. Continue until project is complete

## 💡 Tips for Best Results

### Be Specific
- Provide detailed problem statements
- List exact features you need
- Specify any unique requirements

### Request Incrementally
- Don't ask for everything at once
- Request one page/component at a time
- Test before moving to the next component

### Iterate and Refine
- Ask for improvements: "Make this UI more modern"
- Request alternatives: "Give me 3 different designs for this card"
- Fix issues: "The button is not responsive on mobile"

## 🎨 Design Customization

If you want a different design style, modify the "Design System Specifications" section:

### For a Minimalist Style:
- Remove glassmorphism effects
- Use solid colors instead of gradients
- Reduce animations
- Simplify shadows

### For a Bold/Vibrant Style:
- Increase gradient intensity
- Add more animations
- Use brighter colors
- Larger, bolder typography

### For a Corporate/Professional Style:
- Use neutral color palette (grays, blues)
- Subtle shadows and effects
- Clean, structured layouts
- Professional typography

## 📋 Checklist Before Sending

- [ ] Problem statement is clear and detailed
- [ ] All API services are listed
- [ ] Core features are defined
- [ ] Database tables are outlined
- [ ] API endpoints are specified
- [ ] All required pages are listed
- [ ] Design preferences are noted (optional)

## 🔄 Example Workflow

1. **Day 1**: Send prompt → Get scaffold → Review structure
2. **Day 2**: Request core setup files (layout, globals.css, utils)
3. **Day 3**: Request UI components library
4. **Day 4**: Request landing page and dashboard
5. **Day 5**: Request feature pages one by one
6. **Day 6**: Request API routes
7. **Day 7**: Testing, refinements, and polish

## 🆘 Troubleshooting

### If Claude's response is too long:
- Ask for one file at a time
- Request specific sections of large files

### If the design isn't what you wanted:
- Provide visual references or examples
- Be more specific about design preferences
- Ask for multiple design variations

### If code has errors:
- Copy the error message to Claude
- Ask for fixes: "Fix this error: [error message]"
- Request explanations: "Why is this error happening?"

## 🎯 Success Metrics

Your project scaffold is ready when you have:
- ✅ Complete folder structure
- ✅ All configuration files
- ✅ package.json with dependencies
- ✅ Database schema designed
- ✅ API endpoints specified
- ✅ Clear implementation roadmap

## 📚 Additional Resources

After getting your scaffold, you might want to:
1. Set up Supabase project and get API keys
2. Create a GitHub repository
3. Set up Vercel for deployment
4. Configure environment variables
5. Set up CI/CD pipeline

## 🚀 Ready to Start?

1. Open `CLAUDE_PROJECT_SCAFFOLD_PROMPT.md`
2. Fill in your project details
3. Copy the entire prompt
4. Paste into Claude AI
5. Start building! 🎉

---

**Pro Tip**: Save successful prompts and responses for future reference. You can reuse patterns that work well!