# Full Publishing Pipeline

This guide is the end-to-end workflow for taking a manuscript PDF on a Mac and turning it into a fully edited, Amazon KDP-ready book project.

Status note:

This guide is aligned to Amazon KDP documentation reviewed on April 8, 2026. KDP screens and exact field labels can change. Always verify the final upload flow in the KDP dashboard before publishing.

## Outcome

By the end of this workflow, the author should have:

- a Mac set up for book production
- a private GitHub repository for the book
- a chapter-based manuscript in Markdown
- a repeatable AI-assisted editorial workflow
- clean export files for review
- cover and metadata decisions prepared
- the information needed to complete Amazon KDP title setup and publishing

## Stage 1: Environment Setup

### Required inputs

- a Mac
- the manuscript as a PDF
- internet access
- a GitHub account or willingness to create one
- an OpenAI account for Codex
- optionally, an Anthropic account for Claude Code

### Required software

- VS Code
- Git
- Homebrew
- Pandoc
- Poppler (`pdftotext`)
- Python 3
- Node.js
- Codex
- optional: Claude Code

### Install checklist

Install Homebrew if needed, then:

```bash
brew install git pandoc poppler python node
brew install --cask visual-studio-code
npm install -g @openai/codex
npm install -g @anthropic-ai/claude-code
```

## Stage 2: Project Creation

### Workspace structure

Use a durable workspace on the Mac:

```text
~/Desktop/Projects/
```

Example:

```text
~/Desktop/Projects/
  my-current-book/
  next-book/
  nonfiction-project/
```

### Repository model

Use:

- one public template repo for the workflow
- one private book repo for the manuscript

The private repo should be created from the public template using GitHub's template feature.

## Stage 3: Manuscript Intake

### Source handling rule

Keep the original manuscript PDF unchanged in `input/`.

Recommended filename:

```text
input/original-manuscript.pdf
```

### Import process

Run:

```bash
scripts/extract_pdf.sh input/original-manuscript.pdf
```

This should:

- extract raw text into `support/raw/`
- attempt to split chapters into `manuscript/chapters/`

### Important reality check

PDF extraction is rarely perfect. The first AI pass should focus on:

- OCR errors
- broken paragraphing
- malformed chapter breaks
- stray headers and footers
- punctuation glitches from extraction

## Stage 4: Project Rule Setup

Before major editing begins, complete these files:

- `PROJECT_RULES.md`
- `style-guide/AUTHOR_VOICE.md`
- `AMAZON_KDP.md`
- `reviews/continuity-log.md`

These files define:

- what the AI is allowed to change
- what voice characteristics to preserve
- what continuity concerns must be tracked
- what KDP constraints matter for export

## Stage 5: Editing Pipeline

Do not ask the AI to rewrite the entire book in one shot.

Work chapter by chapter using passes.

### Pass 1: Extraction cleanup

Goal:

- preserve wording
- fix import artifacts only

Tasks:

- repair paragraph boundaries
- remove page-number debris
- restore punctuation
- normalize chapter headings

### Pass 2: Grammar and punctuation

Goal:

- correct technical writing issues without changing story intent

Tasks:

- spelling
- punctuation
- capitalization
- tense consistency
- dialogue punctuation

### Pass 3: Line editing

Goal:

- improve clarity, rhythm, and readability while preserving voice

Tasks:

- tighten repeated phrasing
- improve sentence flow
- reduce accidental ambiguity
- preserve signature tone

### Pass 4: Continuity and consistency

Goal:

- ensure internal coherence across the book

Tasks:

- names
- places
- timeline
- point of view consistency
- repeated facts
- character details

Log unresolved issues in `reviews/continuity-log.md`.

### Pass 5: KDP prep

Goal:

- prepare a manuscript that exports cleanly and behaves well in review

Tasks:

- scene break consistency
- chapter title consistency
- front matter review
- back matter review
- clean DOCX and HTML export

### Pass 6: Human author approval

Goal:

- confirm all substantive changes before submission

Tasks:

- review Git diffs
- spot-check exports
- approve final metadata
- approve final cover

## Stage 6: Export Pipeline

Generate exports with:

```bash
scripts/build_manuscript.sh
```

Expected outputs:

- `output/manuscript.html`
- `output/manuscript.docx`

Use these for:

- screen review
- beta reading
- pre-KDP cleanup

For print, you may later also produce a final print PDF depending on the formatting path you choose.

## Stage 7: Cover Preparation

The manuscript alone is not enough. The author also needs a compliant cover workflow.

### Paperback cover basics

Amazon's current guidance says the print cover must be one PDF containing:

- back cover
- spine
- front cover

Spine text requires at least 79 pages for paperback. For simple KDP-created covers, Cover Creator uses a minimum of 80 pages for spine text.

Use the official calculator/template:

[KDP Cover Calculator](https://kdp.amazon.com/cover-calculator)

### Cover decisions to make

- paperback or ebook only
- trim size
- black-and-white or color interior
- bleed or no bleed
- matte or glossy cover finish
- final page count after formatting

Those decisions affect the cover dimensions and spine width.

## Stage 8: Metadata Preparation

Before opening KDP title setup, prepare all book metadata in advance.

Use the worksheet:

[`KDP_TITLE_SETUP_WORKSHEET.md`](/Users/johnliddy/Desktop/Projects/novel-production-template/KDP_TITLE_SETUP_WORKSHEET.md)

### Items to prepare

- language
- book title
- subtitle, if any
- series name and number, if any
- edition number, if applicable
- author name or pen name
- contributor names
- book description
- publishing rights confirmation
- primary audience
- primary marketplace
- categories
- keywords
- ISBN plan for print
- pricing plan

## Stage 9: Amazon KDP Account And Book Setup

### General KDP flow

Amazon's current official overview breaks the process into:

1. Enter book details
2. Upload and preview book
3. Set rights and pricing

Source:

[Create a Book](https://kdp.amazon.com/help?topicId=G202172740)

### What to watch carefully

Amazon states that some book details cannot be changed after publication without creating a new title.

This is especially important for:

- language
- title
- subtitle
- edition number

Source:

[Update your book details](https://kdp.amazon.com/en_US/help/topic/G200736410)

### Book details rules

The title, subtitle, author name, series information, and ISBN must match the corresponding information in the manuscript and cover where applicable.

Avoid prohibited metadata behaviors like:

- keyword stuffing
- adding promotions
- adding misleading references to other authors
- including URLs or contact info in the description

Source:

[Metadata Guidelines for Books](https://kdp.amazon.com/en_US/help/topic/G201097560)

## Stage 10: Rights, ISBN, And Pricing Decisions

### ISBN

For print books, KDP requires an ISBN unless the book falls into low-content exceptions.

Options:

- use KDP's free ISBN
- buy and provide your own ISBN

Important:

- paperback and hardcover need separate ISBNs
- ebooks do not require an ISBN on KDP
- if you use your own ISBN, KDP metadata must match the ISBN registration exactly

Source:

[What is an ISBN and Imprint?](https://kdp.amazon.com/en_US/help/topic/G201834170)

### Rights

The author will need to confirm they hold the necessary publishing rights.

### Pricing

Prepare:

- primary marketplace
- list price
- territory strategy
- whether to enroll ebook editions in KDP Select, if applicable

## Stage 11: AI Disclosure And Content Compliance

Amazon's current content guidelines say:

- AI-generated content must be disclosed
- AI-assisted content does not need to be disclosed

Amazon defines AI-assisted work as content the author created and then improved with AI tools, including editing and error checking.

Source:

[KDP Content Guidelines](https://kdp.amazon.com/en_US/help/topic/G200672390)

Practical interpretation:

- if the author's manuscript is their own and AI is used to edit or refine it, that is generally AI-assisted
- if AI writes substantial original text for the book, that pushes into AI-generated territory

This distinction should be handled conservatively during final title setup.

## Stage 12: Upload, Preview, And Fix Loop

After uploading the interior and cover:

- run KDP's preview tools
- resolve file warnings and errors
- inspect the digital proof carefully
- order a physical proof copy if the project warrants it

KDP performs:

- automated checks
- manual review after submission

Source:

[Hardcover - Interior Formatting](https://kdp.amazon.com/help?topicId=GYB32MZNQSNZM2CP)

That page is hardcover-specific, but the review concept also reflects the broader KDP print workflow.

## Stage 13: Online Form Completion Checklist

Before sitting down at KDP, have the following ready in one place:

- final book title
- subtitle
- series info
- author and contributor names
- description
- keywords
- categories
- ISBN choice
- trim size
- interior type
- cover finish
- manuscript file
- cover file
- pricing
- rights answers
- AI disclosure answer

If this information is prepared first, KDP setup becomes much smoother.

## Stage 14: Final Submission Standards

Do not treat the book as ready just because the source Markdown looks clean.

The book is ready only when:

- the chapter files are edited
- exports are clean
- metadata is finalized
- cover dimensions are correct
- KDP preview checks pass
- the author approves the final version

## Practical Working Rule

The safest definition of done is:

The author can sit down at KDP with a prepared worksheet, upload the files, answer every setup field confidently, pass preview checks, and submit without inventing anything on the spot.

## Residual Risks

Even with a strong workflow, these still require human review:

- subtle prose taste decisions
- legal ownership questions
- final cover design judgment
- final metadata positioning
- final KDP dashboard choices

## Official References

- [Create a Book](https://kdp.amazon.com/help?topicId=G202172740)
- [Metadata Guidelines for Books](https://kdp.amazon.com/en_US/help/topic/G201097560)
- [Update your book details](https://kdp.amazon.com/en_US/help/topic/G200736410)
- [KDP Categories](https://kdp.amazon.com/help/topic/A200PDGPEIQX41)
- [What is an ISBN and Imprint?](https://kdp.amazon.com/en_US/help/topic/G201834170)
- [KDP Content Guidelines](https://kdp.amazon.com/en_US/help/topic/G200672390)
- [Create a Paperback Cover](https://kdp.amazon.com/en_US/help/topic/G201953020?hc_location=ufi)
- [KDP Cover Calculator](https://kdp.amazon.com/cover-calculator)
- [KDP Tools and Resources](https://kdp.amazon.com/help?topicId=G200735480)
