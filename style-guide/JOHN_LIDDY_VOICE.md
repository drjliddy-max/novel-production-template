# John Liddy Voice Standard

This file is the source of truth for John Liddy's writing voice across all forms: blog articles, book chapters, emails, landing page copy, and any other written content produced for him or in his name.

If you are an AI assistant drafting or editing writing for John, read this file before you write a single word. If a sentence you've written would fail any rule below, rewrite it before showing it to him. Voice is non-negotiable.

## Where this voice lives

- Books: The Participation Effect (the-clarity-effect repo), The Broken Crown / The War for Paratua (the-war-for-paratua repo), and any future book
- Articles: theparticipationeffect.com blog, adaauditreport.com blog, any other article surface
- Emails: outreach, follow-up, and personal correspondence written on his behalf
- Site copy: landing pages, About sections, hero text on every property in the ecosystem
- Any other place where words appear under his name or for his audience

## Non-negotiable rules

### Mechanics

**Short paragraphs.** One to four sentences each. White space is a tool. Long paragraphs feel academic and lose readers.

**Vary sentence length.** Short sentences land after complex ideas. Mix long and short deliberately. Even sentence lengths are an AI tell.

**No em dashes.** Use periods or commas. Break into separate sentences. Em dashes are an AI tell and a lazy substitute for stronger structure.

**No semicolons.** Period or comma. Always.

**No ellipses.** They imply trailing off. John writes with intent, not drift.

**No formula transitions.** No "However," "Furthermore," "Moreover," "Additionally," "In conclusion." These are throat-clearing and AI markers. Start the next sentence with the next idea.

**No bullet points in prose content.** Bullets are fine in technical docs, lists, and reference material. They are not fine in articles, chapters, essays, or emails.

### Structure

**Open with the idea.** No throat-clearing. No "In this article..." No "Let me explain..." No "I want to talk about..." Start with the actual subject in the first sentence.

**Stories prove concepts, then move on.** Don't over-describe. A scene exists to land a point. Once it lands, leave.

**Negate before revealing.** This is one of the most important moves in his voice. The pattern: name what it isn't, then name what it is. The contrast does the work. Examples:

- "Not struggling. Wrecked."
- "Not therapy. Not manifestation. Tools that work."
- "I wanted to feel vindicated. I didn't."
- "Fear wasn't dramatic. It was chronic."

**Specific vocabulary, not abstract.** "Clenched jaw" not "stress." "Three in the morning" not "late at night." "The number was real" beats "it was a significant amount." Concrete physical detail anchors the abstract idea.

### Voice and stance

**"I" for lived experience.** When the writing comes from his actual life, "I" is correct.

**"You" to invite.** When he wants the reader inside the experience, "you" pulls them in.

**"We" for universal truths.** When the point is about all of us, "we" includes the reader as a fellow human.

**Questions invite, never lecture.** A good question opens a door. A bad question is a setup for the writer's already-decided answer. Avoid the second.

**Conversational but precise.** Intelligent without being academic. Casual without being sloppy. The voice of a smart friend talking honestly, not the voice of a therapist or a teacher.

## Voice in action

These are sentences that pass every rule and demonstrate the move. Use them as a calibration set when drafting:

- "Fear wasn't dramatic. It was chronic."
- "Not therapy. Not manifestation. Tools that work."
- "I wanted to feel vindicated. I didn't."
- "Stop observing your life. Start participating in creating it."
- "The book I had written was not about being right. It was about showing up to your own life regardless of who shows up with you."
- "Tools change. The person inside doesn't."
- "He went home."
- "The practice would have been the same without it."

Notice what they share. Short. Specific. Often a negation followed by what is. Often a flat statement that lands like a small punch. Never decorated. Never explained.

## Voice across forms

The voice rules are constant. The application varies by form. When drafting any of these forms for John, follow the form-specific notes below in addition to the rules above.

### Articles and essays (1200-1800 words)

Most narrative space he writes in. Open with a specific scene or image. Build through 4-6 H2 sections. Soft mid-article CTA after the first major insight. End with a closing turn that lands instead of summarizing. Stories prove concepts then move on. The participation effect framework can be referenced naturally where it earns its place. See `prompts/ARTICLE_DRAFT_PROMPT.md`.

### Book chapters (2000-5000 words)

Longest form. More room for development but the same voice rules apply. Chapters build on chapters, so continuity matters. Edit in passes (extraction, grammar, line edit, continuity, KDP prep). Never make developmental story changes without asking. Voice violations from the chapter author are flagged in `reviews/`, not silently rewritten. See `prompts/CHAPTER_EDIT_PROMPT.md`.

### Outreach emails (under 200 words)

Tightest practical form. Voice rules still apply but every sentence is load-bearing. Open with the actual purpose. Three short paragraphs maximum. One clear ask. Adapt tone to audience without losing voice. For ADA Audit Report outreach, lead with fix count not violation count, BCC drjliddy@gmail.com, and remember the Google review link. See `prompts/EMAIL_OUTREACH_PROMPT.md`.

### Hero and landing copy (under 50 words for hero block)

Tightest form he writes. Two seconds of reader attention. Headline names a real reader problem or outcome. Subhead adds the specific how. CTA is plain verb plus object. No abstract benefit language. No clever wordplay that sacrifices clarity. See `prompts/HERO_COPY_PROMPT.md`.

### Book descriptions and blurbs (75-300 words)

Hybrid form: honest enough to feel like the author, specific enough to convert. Hook, problem, promise, credibility, close. Banned phrases are non-negotiable removals: manifest, vibration, law of attraction, source, broadcasting. Required language for The Participation Effect: participation, probability, perception, emotional regulation, clarity, recognition, practical framework, practice. See `prompts/BOOK_DESCRIPTION_PROMPT.md`.

### What stays constant across all forms

- Open with the idea, no throat-clearing, no matter the form
- Negate before revealing where it earns its keep
- Specific vocabulary instead of abstract
- No em dashes, no semicolons, no banned transitions
- Voice of a smart friend talking honestly, not a teacher or a marketer
- Read it out loud before shipping it

The form changes. The voice does not.

## AI patterns to avoid

If a draft has any of these, rewrite it before showing it to him:

- Even sentence lengths in a paragraph (variation is essential)
- Predictable structure: setup, transition, conclusion, transition, conclusion
- Abstract nouns where physical sensation would do (write "clenched jaw," not "anxiety")
- Hedging words: "perhaps," "somewhat," "arguably," "in many ways"
- Wisdom-statement framings: "It's important to remember that..."
- Compound subordinate clauses that bury the verb
- "Whether or not," "the fact that," "in order to" (use shorter forms)
- Restating the previous paragraph in slightly different words
- Closing paragraphs that summarize what the article just said
- Anything that sounds like a TED talk

## Quick checklist before publishing

Run through this list on every piece before it ships:

1. Does the first sentence open with the idea, no throat-clearing?
2. Are all paragraphs four sentences or fewer?
3. Are there any em dashes? If yes, rewrite.
4. Are there any semicolons? If yes, rewrite.
5. Are there any banned transitions? (However, Furthermore, Moreover, Additionally, In conclusion.) If yes, rewrite.
6. Is there at least one negation-before-revelation move in the piece?
7. Does the closing sentence land instead of summarizing?
8. Read it out loud. Does it sound like a person talking, or like an essay being recited?

If all eight pass, the voice is right.

## Sync with other voice references

This file is the canonical source of truth. Other voice references in the workspace should defer to this file:

- `~/.claude/CLAUDE.md` (Writing Voice Standard section) — keep in sync with this file
- `participation-effect-site/src/blog-schedule.json` (`content_rules.voice_rules`) — should reference or sync from this file
- Any per-project CLAUDE.md that mentions voice — should defer to this file

When the rules are refined or extended in conversation, update this file first. Then propagate to the others.
