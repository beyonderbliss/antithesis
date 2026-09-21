# Antithesis — AI Engineering Rules

## STOP BEFORE MODIFYING

Before modifying this repository, read this file and inspect the current source of truth.

## Non-negotiable constraints

1. **Gemini Canvas is the runtime.** Antithesis MUST remain a Gemini Canvas-native application.
2. **Do not replace Canvas-provided multimodal AI.** Do not migrate image generation to Cloudflare Workers, a standalone Gemini API integration, a user-provided Gemini API key, another image-generation API, or a proxy merely to make the application standalone.
3. **This is a refactoring project, not a rewrite.** The goal is to extract the existing single-file application into a structured architecture while preserving behavior.
4. **Preserve behavior unless a behavior change is explicitly requested.** This includes image generation, multimodal Gemini interaction, manual/automatic inpainting, master-image / anti-degradation flow, reference and mask behavior, payload semantics, aspect-ratio handling, blending, gallery, chat/orchestration, prompt construction, state transitions, and UI behavior.
5. **Do not change multiple dimensions at once without necessity.** Prefer extracting existing logic first, then verifying it, rather than moving code while redesigning its algorithm or payload.
6. **Treat Canvas AI as a runtime boundary.** Before abstracting or replacing any Gemini/Canvas interaction, inspect the actual implementation and identify the runtime contract. Do not invent a replacement service simply because it is easier to modularize.
7. **When uncertain, inspect before changing.** Do not infer that a conventional standalone architecture is appropriate for Antithesis.

## Baseline

The original behavioral baseline is commit:

`48fa807` — `[GEB] baseline: Antithesis single-file`

Baseline source:

`antithesis_project1.jsx`

At baseline it contains 11,138 lines.

## Refactoring principle

> Modularize the code. Do not modularize away the runtime that makes Antithesis possible.

Every proposed architectural change should be checked against these constraints before implementation.
