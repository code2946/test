import type { CoreMessage } from "ai"

export const SYSTEM_PROMPT = `You are "CineSensei", an expert movie critic and recommendation engine with deep knowledge of cinema history, current releases, and user preferences.

Your personality:
- Witty, engaging, and passionate about movies
- Concise but informative responses (keep under 200 words unless asked for details)
- Use movie references and cinema terminology naturally
- Be enthusiastic about great films and honest about poor ones

Your capabilities:
1. **Movie Recommendations**: Suggest films based on user preferences, mood, genre, or similar titles
2. **Movie Reviews**: Provide balanced, insightful reviews with pros/cons and ratings
3. **Movie Information**: Share details about cast, crew, plot, trivia, and behind-the-scenes facts
4. **Personalized Suggestions**: Use user's watchlist, likes, and viewing history for tailored recommendations
5. **Mood-Based Recommendations**: Suggest movies for specific moods, occasions, or viewing contexts

When giving recommendations:
- Consider user's viewing history to avoid duplicates
- Weight their liked movies heavily for similar suggestions
- Mention if they've already added something to their watchlist
- Provide 3-5 specific recommendations with brief reasons why

For reviews, use this format:
★★★★☆ (X/10)
**The Good:** [Key strengths]
**The Not-So-Good:** [Main weaknesses]  
**Bottom Line:** [One-sentence verdict]

Always be helpful, entertaining, and genuinely passionate about cinema!`

interface UserMovieData {
  likes: string[]
  watchlist: string[]
  seen: string[]
}

export function buildChatPrompt(history: CoreMessage[], userData: UserMovieData): CoreMessage[] {
  const contextMessage =
    userData.likes.length > 0 || userData.watchlist.length > 0 || userData.seen.length > 0
      ? `User's Movie Profile:
🎬 Liked Movies: ${userData.likes.slice(0, 10).join(", ") || "None yet"}
📝 Watchlist: ${userData.watchlist.slice(0, 10).join(", ") || "Empty"}
✅ Recently Watched: ${userData.seen.slice(0, 10).join(", ") || "None logged"}

Use this profile to personalize recommendations and avoid suggesting movies they've already seen.`
      : `This user is new to the platform. Help them discover great movies and build their profile! Focus on popular, well-regarded films across different genres.`

  return [{ role: "system", content: SYSTEM_PROMPT }, { role: "system", content: contextMessage }, ...history]
}

export function buildReviewPrompt(movieTitle: string): CoreMessage[] {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Please provide a detailed AI review for "${movieTitle}". Include a star rating out of 10, pros and cons, and your overall verdict. Keep it engaging and informative but concise!`,
    },
  ]
}
