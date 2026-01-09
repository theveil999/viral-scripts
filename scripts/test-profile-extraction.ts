/**
 * Test script for profile extraction
 * Run with: npm run test-extraction
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { extractVoiceProfile, ProfileExtractionError } from "../src/lib/services/profile-extraction";

// Sample transcript simulating an interview
const SAMPLE_TRANSCRIPT = `
Interviewer: So, tell me a little about yourself. Who are you?

Jessica: Okay so like, I'm Jess, but everyone calls me JessyBaby online. Um, I'm 26, from Texas originally but I live in LA now. I'm like... honestly I don't know how to describe myself. I guess I'm just this bubbly chaotic mess who somehow ended up doing this? Like my friends always say I'm "unhinged in the best way" and I'm like okay fair, that's accurate.

Interviewer: What makes you different from other creators?

Jessica: Oh god, um. So like, I think it's that I literally have zero filter? Like I will say the most unhinged shit and not even realize it's weird until after. My toxic trait is that I overshare but like, people seem to love it? Like they DM me saying they feel like we're actually friends and honestly that's the goal.

I also curse like, a lot. Probably too much. Like every other fucking word sometimes, sorry not sorry. And I have this thing where I start every sentence with "so like" - it's a problem, I know.

Interviewer: Tell me about your content style. What do you post?

Jessica: So like, mostly just talking to camera stuff. Storytimes are my thing - I have so many dating horror stories it's insane. Like oh my god, men are the worst? Don't get me started. I also do like get ready with me videos, try-ons, that kind of stuff.

I'm pretty spicy - like I'm comfortable going full send but I try to keep it classy enough for Instagram, you know? Like suggestive but not gonna get me banned. My thing is like... I want guys to feel like I'm their cool girl best friend who they maybe want to fuck? Is that weird to say? Whatever.

Interviewer: What topics are you passionate about?

Jessica: Dating and relationships for sure. I can literally talk for hours about toxic ex boyfriends and red flags. Also skincare - I'm lowkey obsessed with skincare even though my skin is still trash sometimes. Um, reality TV - especially Love Island and the Bachelor. And like... honestly trauma? Like in a funny way though. Making jokes about therapy and mental health stuff but like, relatable.

Interviewer: What won't you talk about?

Jessica: Politics. Hard no. I'm not trying to get into it with anyone. Also like, super personal family stuff is off limits. And I won't do anything with like degradation or humiliation - that's not my vibe at all. I'm more playful and fun, not mean.

Interviewer: How do you flirt?

Jessica: So like, my flirting style is basically just being unhinged? Like I'll say something super forward and then be like "anyway" and move on like nothing happened. I'm very much like... direct but in a funny way? Like "you're cute, we should make out sometime, anyway what are you doing this weekend" kind of energy.

My type is like, emotionally unavailable men who gaslight me, but I'm working on that in therapy lol. No but actually I like guys who can handle my energy and match it. Like don't be boring.

Interviewer: What do fans usually say about you?

Jessica: They say I make them feel less alone about their own messy lives, which is honestly the best compliment. Like I'm not trying to be perfect or aspirational, I'm just out here being a disaster and they relate to that. They call me their "unhinged bestie" and honestly? Goals.

Oh and they love my catchphrase - I always say "anyway, moving on" after I say something crazy. And "we don't talk about that" when I accidentally overshare. It's become like a thing.

Interviewer: Give me an example of how you actually talk in videos.

Jessica: Okay so like, I'd be like: "So I went on this date last night and oh my god you guys. Like actually the audacity of this man? He told me I talk too much. Me? Talking too much? Never heard of it. Anyway we made out in his car after so like, who's the real winner here. Don't answer that. Follow me for more dating advice that you should absolutely not take."

That's pretty much my vibe. Just like, unhinged commentary with a side of self-deprecating humor.
`;

async function main() {
  console.log("🔍 Testing Voice Profile Extraction\n");
  console.log("=".repeat(60));
  console.log("\n📝 Sample Transcript (first 500 chars):");
  console.log(SAMPLE_TRANSCRIPT.slice(0, 500) + "...\n");
  console.log("=".repeat(60));
  console.log("\n⏳ Extracting voice profile with Claude...\n");

  const startTime = Date.now();

  try {
    const profile = await extractVoiceProfile(SAMPLE_TRANSCRIPT);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`✅ Extraction complete in ${duration}s\n`);
    console.log("=".repeat(60));
    console.log("\n📊 EXTRACTED VOICE PROFILE:\n");
    console.log(JSON.stringify(profile, null, 2));
    console.log("\n" + "=".repeat(60));

    // Print summary
    console.log("\n📈 PROFILE SUMMARY:");
    console.log(`   Name: ${profile.identity.name}`);
    console.log(`   Stage Name: ${profile.identity.stage_name}`);
    console.log(`   Primary Archetype: ${profile.archetype_assignment.primary}`);
    console.log(`   Secondary Archetype: ${profile.archetype_assignment.secondary || "none"}`);
    console.log(`   Confidence: ${(profile.archetype_assignment.confidence * 100).toFixed(0)}%`);
    console.log(`   Energy Level: ${profile.personality.energy_level}`);
    console.log(`   Explicitness: ${profile.spicy.explicitness_level}`);
    console.log(`   Swear Frequency: ${profile.voice_mechanics.swear_frequency}`);
    console.log(`   Sample Quotes: ${profile.sample_speech.length}`);
    console.log(
      `   Catchphrases: ${profile.voice_mechanics.catchphrases.join(", ") || "none"}`
    );
    console.log(
      `   Parasocial Strengths: ${profile.parasocial_config?.strengths?.join(", ") || "none"}`
    );

    console.log("\n✨ Test passed!\n");
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`❌ Extraction failed after ${duration}s\n`);

    if (error instanceof ProfileExtractionError) {
      console.error("Error:", error.message);
      if (error.validationErrors) {
        console.error("Validation errors:", error.validationErrors);
      }
      if (error.rawResponse) {
        console.error("\nRaw response (first 1000 chars):");
        console.error(error.rawResponse.slice(0, 1000));
      }
    } else {
      console.error(error);
    }

    process.exit(1);
  }
}

main();
