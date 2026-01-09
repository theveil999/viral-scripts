# EXAMPLES.md - Voice Profile & Script Generation Gold Standard

> **Purpose**: Demonstrates the complete input→output pipeline for the viral script system.
> **Test Case**: Anna Jules - extracted from 87-minute creator interview (Jan 2, 2026)

---

## 1. VOICE PROFILE JSON

This is the structured output from processing a creator interview transcript.

```json
{
  "profile_version": "1.0",
  "created_at": "2026-01-04",
  "source": "creator_interview_transcript",
  
  "identity": {
    "stage_name": "Anna Jules",
    "nicknames": ["Juel", "Jules"],
    "self_description": "Mix of a lot of things - country background with city in me now, outgoing and bubbly, a little too bubbly sometimes, don't feel embarrassment, will do anything anywhere anytime, keep people guessing, super bubbly and spontaneous",
    "best_friend_description": "That girl is absolutely insane, but I love her to death",
    "three_words": ["bubbly", "iconic", "insane"],
    "dog_personality": "golden_retriever",
    "drunk_dog_personality": "chihuahua",
    "vibe_statement": "I'm a cute western sassy hippie girl and I want them to feel like they've just made a friend, even if it's a spicy friend"
  },

  "background": {
    "origin": "Virginia country - hunting, fishing, squirrel stew, shooting",
    "current_location": "Arizona (city-based now)",
    "notable_skills": [
      "Singer (Carnegie Hall, band experience)",
      "Figure skater (14 years)",
      "Cleaning business owner ($4-5K/month)"
    ],
    "education_style": "self-made, networking over degrees",
    "relationship_status": "single, dating scene commentary"
  },

  "voice_patterns": {
    "cursing_level": "heavy",
    "curse_words": ["fuck", "shit", "damn", "bitch", "motherfucker"],
    "natural_frequency": "every 2-3 sentences",
    
    "catchphrases": [
      "What the fuck?",
      "Good soup",
      "Lug nut",
      "What the fuck are you doing, you lug nut?",
      "Period",
      "Play with me"
    ],
    
    "sarcasm_marker": "babes",
    "emphasis_words": ["literally", "absolutely", "obsessed", "insane", "fire"],
    
    "sentence_starters": [
      "So like",
      "Okay so",
      "I'm not gonna lie",
      "Like",
      "Um"
    ],
    
    "sentence_enders": [
      "or whatever",
      "I don't know",
      "but yeah",
      "so yeah",
      "it's fine"
    ],
    
    "texting_style": {
      "grammar": "proper (grammar nazi)",
      "hates": ["misspellings", "wrong your/you're/there/their", "excessive abbreviations"],
      "allows": ["LOL", "LMAO", "FML"],
      "emojis": "moderate use"
    }
  },

  "personality_traits": {
    "core": [
      "authentically unfiltered",
      "zero embarrassment threshold", 
      "spontaneous idea generator",
      "bubbly energy even with RBF",
      "loyal to real ones"
    ],
    
    "psychology": {
      "motivation": "money-driven when reward is visible",
      "overthinking": "high (self-aware about it)",
      "gratitude_baseline": "high - could always be worse",
      "goals": "financial freedom to do whatever the fuck I want whenever the fuck I want"
    },
    
    "toxic_traits": [
      "starts fights when drunk (targets women who stare)",
      "anger issues (managed through yoga/meditation)",
      "trigger phrase: Can a bitch say excuse me?"
    ],
    
    "conflict_style": "direct confrontation, no sugarcoating"
  },

  "brand_anchors": {
    "primary_obsession": {
      "brand": "Taco Bell",
      "intensity": "extreme - wants sponsorship",
      "order": "Number seven, chicken quesadilla with Doritos Locos Taco instead of regular hard shell, two soft tacos, cantina chicken tender taco, Baja Blast with a shit ton of Diablo sauce",
      "content_potential": "cheese sauce photoshoot, party pack challenges, drunk Taco Bell runs"
    },
    
    "secondary_interests": [
      "Sedona/energy/vortexes",
      "Stranger Things (current obsession - acts like Eleven, uses mouth breathers)",
      "Tattoos (defensive about tattoo discrimination)",
      "Raves/EDM (Subtronics, Grizz)",
      "Wine"
    ],
    
    "anti_interests": [
      "TikTok dancing (oversaturated, played out)",
      "Cheesy pickup lines",
      "Fake personas",
      "Politics (doesnt vote - screwed either way)"
    ]
  },

  "content_preferences": {
    "formats_wanted": [
      "lip sync with text overlay",
      "try-on hauls",
      "get ready with me",
      "funny/stupid viral recreations",
      "suggestive position reveals (Juno by Sabrina Carpenter style)"
    ],
    
    "formats_avoided": [
      "cooking content (private skill)",
      "gaming",
      "TikTok dances (except select ones like Chanel by Tyla)"
    ],
    
    "explicit_comfort": "full send as long as no shadowban risk",
    "role_model": "Angela Mazanti - funny + hot, natural, varied content"
  },

  "humor_profile": {
    "type": ["absurdist", "dumb/stupid humor", "self-deprecating", "shock value"],
    "example_joke": "I'm just here to tell you that I'm absolutely obsessed with Taco Bell and if I could shove it up my ass without risking an infection, I would do it",
    "avoids": ["cheesy humor", "pickup lines", "public dark humor (cancel culture fear)"],
    "laughs_at": "things others find stupid + conventionally funny things"
  },

  "flirting_style": {
    "approach": "making fun of you to pulling your pants down, no in-between",
    "turn_ons": [
      "app-controlled toy in public (restaurant game)",
      "dominant men",
      "being called good girl",
      "chin grabbing + kissing"
    ],
    "bedroom_dynamic": "submissive (unless pissed off then dominant - I will choke you out)"
  },

  "differentiators": {
    "unique_selling_points": [
      "Genuine personality that fans love",
      "No sugarcoating, no fake persona",
      "Singer with real talent (Carnegie Hall)",
      "Country roots + city edge combo",
      "High tolerance for embarrassment"
    ],
    "fan_feedback": "people are obsessed with my personality - I dont act like Im better than anyone"
  },

  "voice_transformation_rules": {
    "always_include": [
      "At least one curse word per script",
      "Self-aware humor about own behavior",
      "Direct address to viewer as friend",
      "Taco Bell reference when food-adjacent topics arise"
    ],
    "never_include": [
      "Formal language",
      "Excessive emojis in scripts",
      "Cheesy pickup lines",
      "Fake enthusiasm or forced energy"
    ],
    "tone_calibration": {
      "baseline": "bubbly but real",
      "spicy_content": "playfully aggressive",
      "vulnerability": "self-deprecating but confident"
    }
  }
}
```

---

## 2. EXAMPLE GENERATED SCRIPTS

Scripts generated using Anna's voice profile, demonstrating the system output format.

### Script 1: Taco Bell Obsession (Brand Anchor Content)

```yaml
script_id: anna_jules_001
hook_type: pattern_interrupt
hook_source: original
content_type: personality_reveal
estimated_duration: 15s
platform: instagram_reels

hook: "POV: my friends tag me in Taco Bell content for the 47th time this week"

body: |
  And I'm not even mad about it. Like yes, tag me. 
  I had a custom windshield sticker that said Taco Bell for life 
  and I stand by that decision.
  
  They need to freaking sponsor me at this point.
  Give me my free queseritos for life.
  I've earned it.

cta: "Drop a taco emoji if you have a food youd literally marry"

text_overlay: "me pretending Im not about to order 3 party packs"
audio_suggestion: "trending audio with food/obsession theme"
visual_direction: "Start with fake annoyed face, transition to genuine excitement, end with shrug"

voice_markers_used:
  - catchphrase: "freaking"
  - brand_anchor: "Taco Bell", "queseritos"
  - authenticity: "I stand by that decision"
  - direct_address: conversational tone
```

### Script 2: Dating Scene Commentary (Relatable Hook)

```yaml
script_id: anna_jules_002
hook_type: relatable_frustration
hook_source: corpus_inspired
content_type: dating_commentary
estimated_duration: 12s
platform: instagram_reels

hook: "The dating scene is absolutely disgusting and heres my proof"

body: |
  So I go from making fun of you
  to pulling your pants down.
  There is no in between.
  
  And somehow thats still too much for these men to handle?
  
  Play with me.

cta: "Tell me your dating red flag in 3 words"

text_overlay: "when he says hes intimidated by confident women"
audio_suggestion: "Juno by Sabrina Carpenter or similar suggestive trending audio"
visual_direction: "Confident energy, slight smirk, end with dismissive hand wave"

voice_markers_used:
  - flirting_style: "making fun of you to pulling your pants down"
  - catchphrase: "Play with me"
  - personality: zero embarrassment, direct
```

### Script 3: RBF Defense (Self-Aware Humor)

```yaml
script_id: anna_jules_003
hook_type: misconception_flip
hook_source: original
content_type: personality_reveal  
estimated_duration: 18s
platform: instagram_reels

hook: "People think Im about to fight them but actually"

body: |
  I have really bad RBF. Like I look like I could kill somebody.
  
  But Im literally happy as shit.
  
  Its giving golden retriever energy trapped in a 
  dont fuck with me face.
  
  People who dont know who they are feel threatened 
  by people who do. Thats not my problem.

cta: "RBF gang where you at"

text_overlay: "me being told to smile more for the 1000th time"
audio_suggestion: "audio with attitude/unbothered energy"
visual_direction: "Start with intense RBF stare, break into genuine smile, back to RBF"

voice_markers_used:
  - cursing: "shit", "fuck"
  - dog_personality: "golden retriever"
  - philosophy: authentic self-awareness quote
  - humor_type: self-deprecating + confident
```

### Script 4: Country Roots Reveal (Background Content)

```yaml
script_id: anna_jules_004
hook_type: unexpected_reveal
hook_source: original
content_type: origin_story
estimated_duration: 20s
platform: instagram_reels

hook: "Things that make sense when you find out Im from country Virginia"

body: |
  I grew up eating squirrel stew. Yes, actual squirrels.
  
  My nanny used to hunt turkeys at 2am.
  
  Ive been shooting since before I could do long division.
  
  And now I live in Arizona doing... this.
  
  The character development is insane but we dont 
  ask questions, we just vibe.

cta: "Whats your weirdest hometown flex?"

text_overlay: "city girl with country trauma"
audio_suggestion: "country-to-city transformation trending audio"
visual_direction: "Counting on fingers for each point, end with casual shrug"

voice_markers_used:
  - background: Virginia country roots
  - three_words: "insane"
  - sentence_ender: "we just vibe"
  - authenticity: real details, no sugarcoating
```

### Script 5: Spicy Position Reveal (Suggestive Content)

```yaml
script_id: anna_jules_005
hook_type: curiosity_gap
hook_source: corpus_adapted
content_type: suggestive_humor
estimated_duration: 10s
platform: instagram_reels

hook: "Have you ever tried... this one?"

body: |
  [Lip syncing to Juno by Sabrina Carpenter]
  
  [Cut to pile driver position - fully clothed]
  
  What? Im just stretching.
  Good soup.

cta: "Link in bio if you want the advanced tutorial"

text_overlay: "yoga class is going great"
audio_suggestion: "Juno - Sabrina Carpenter (specific verse about positions)"
visual_direction: "Innocent face during lyrics, position reveal on this one, deadpan delivery of Good soup"

voice_markers_used:
  - content_style: suggestive but plausibly deniable
  - catchphrase: "Good soup"
  - humor_type: absurdist, deadpan
  - explicit_comfort: full send without shadowban risk
```

---

## 3. VALIDATION CHECKLIST

For each generated script, verify:

| Check | Anna Jules Script Requirement |
|-------|------------------------------|
| Cursing | At least 1 curse OR attitude equivalent |
| Authenticity | No fake enthusiasm, real personality |
| Direct Address | Talks TO viewer, not AT them |
| Brand Anchor | Taco Bell ref when relevant (not forced) |
| Catchphrase | Uses at least one from profile |
| Humor Type | Absurdist/dumb/self-deprecating |
| No Violations | No cheesy lines, no TikTok dance refs |
| Voice Match | Reads like her interview speech patterns |

---

## 4. INPUT TO OUTPUT MAPPING

### Raw Interview Excerpt (Input):
```
Jewel Anna: Hey guys, Im Anna. Im just here to tell you that Im 
absolutely obsessed with Taco Bell and if I could shove it up my 
ass without risking an infection, I would do it. Okay, thats all 
for now. Bye.
```

### System Processing:
1. **Hook Extraction**: "Im absolutely obsessed with Taco Bell"
2. **Voice Markers Identified**: 
   - Shock value humor
   - Brand obsession  
   - Direct address (Hey guys)
   - Absurdist escalation
3. **Corpus Match**: Food obsession scripts (peechi Chick-fil-A format)
4. **Transformation Applied**: Maintain shock value, adjust for platform limits

### Generated Script (Output):
See Script 1 above - sanitized version maintains her energy while being platform-safe

---

## 5. SYSTEM USAGE NOTES

**For Claude Project Context:**
- This file demonstrates the EXPECTED OUTPUT FORMAT
- Voice profiles should capture this level of detail
- Scripts must pass the validation checklist
- Interview to Profile to Script is the gold standard pipeline

**Quality Benchmarks:**
- Profile completeness: 15+ distinct voice markers minimum
- Script authenticity: Should be indistinguishable from creators own ideas
- Platform safety: Suggestive but never explicit in script text
- Hook strength: Must work in first 1-3 seconds

---

*Generated: 2026-01-04 | System: Viral Script Generator v1.0 | Creator: Anna Jules*
