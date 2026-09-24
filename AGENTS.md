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

## Refactoring method — Incremental Boundary Refactoring

Antithesis must be refactored by finding real responsibility boundaries in the existing code, not by applying patches around symptoms.

### Core sequence

Use this sequence for structural work:

**AUDIT → IDENTIFY RESPONSIBILITY → DEFINE BOUNDARY → EXTRACT MINIMUM NECESSARY CODE → REMOVE OLD DUPLICATE → VERIFY BEHAVIOR → COMMIT → NEXT BOUNDARY**

Each step must be based on the current source of truth.

### Rules

1. **Extract, don't patch.**
   - If a problem is caused by tangled responsibilities, do not add another conditional, workaround, compatibility layer, or duplicate implementation merely to make the current structure work.
   - Find the responsibility boundary and move the responsibility to the correct place.
   - If an extraction appears to require a workaround, stop and reconsider the boundary instead of permanently adding the workaround.

2. **One responsibility, one boundary.**
   - A module should have a clear reason to exist.
   - Keep related behavior together when it belongs to the same domain.
   - Do not split code merely because a file is large.

3. **Prefer simplicity over abstraction.**
   - Do not introduce Base/Adapter/Provider/Controller layers, generic service frameworks, or other abstractions unless the existing code has a concrete repeated responsibility that requires them.
   - Do not create an abstraction only because it looks architecturally sophisticated.
   - The resulting structure should be easier to understand than the structure it replaces.

4. **Do not reduce features to make code look clean.**
   - "Simpler" means clearer responsibility and less accidental coupling.
   - It does NOT mean removing features, changing behavior, shortening code for its own sake, or weakening the existing UX.

5. **No zombie code.**
   - After a responsibility has been migrated successfully, remove the obsolete implementation.
   - Do not keep old and new implementations side by side "just in case."
   - Do not leave dead compatibility paths, abandoned helpers, or temporary migration branches in the production architecture.

6. **No duplicate implementations.**
   - One responsibility should have one authoritative implementation.
   - Do not solve the same problem in multiple modules and select between them with flags unless that distinction is an intentional product requirement.

7. **Refactor one architectural dimension at a time.**
   - Do not simultaneously extract modules, redesign algorithms, change payload contracts, alter state management, and redesign UI unless a dependency makes it unavoidable.
   - Prefer small, reversible architectural steps.

8. **Behavior lock.**
   - Before/after behavior must remain equivalent during refactoring.
   - A refactor commit is not the place to "also fix" unrelated behavior.
   - If a bug is discovered, record it separately unless the bug fix is inseparable from establishing the new boundary.

9. **Use Git as a checkpoint system.**
   - Before a meaningful architectural step, establish a known-good commit.
   - After extraction, inspect the diff and verify the affected behavior.
   - If the boundary makes the code harder to reason about or introduces regressions, revert or redesign rather than stacking another patch on top.

10. **Extract the minimum necessary code.**
    - Start with the smallest genuinely independent responsibility.
    - Do not create the final architecture in one pass.
    - Let the architecture emerge from real dependencies.

11. **Do not move complexity; remove accidental coupling.**
    - Moving a large block from `antithesis_project1.jsx` into another large file is not a successful refactor.
    - A new module must have a clearer contract and narrower responsibility than the code it replaces.

12. **Do not introduce speculative folders or modules.**
    - Create a module only when a real responsibility is ready to be extracted.
    - Avoid empty architecture, placeholder layers, and future-proofing that has no current use.

13. **Preserve runtime contracts.**
    - Especially preserve the Gemini Canvas runtime bridge, module loading behavior, React/Lucide runtime assumptions, and existing payload semantics unless an explicit change is required.

### Responsibility classification

When deciding where code belongs, classify it before moving it:

- **Runtime / infrastructure** — Canvas runtime, external loading, environment bridges.
- **Pure utility** — deterministic input/output logic with no application state.
- **Domain logic** — Antithesis concepts such as image registry, references, masks, prompts, generation, inpainting, chat, and voice.
- **Application orchestration** — coordinates domain logic, state, and runtime operations.
- **UI** — presentation and interaction components.

Do not force code into a category when its dependencies contradict that boundary. Use the actual dependency graph to define the boundary.

### Refactor quality test

A refactor is successful only when all of these are true:

- Existing behavior is preserved.
- The extracted responsibility has a clear owner.
- The old duplicate implementation is gone.
- The new boundary is simpler to understand.
- No workaround was introduced merely to make extraction possible.
- No unnecessary abstraction was introduced.
- No unrelated feature or UI change was bundled into the step.
- The next refactoring step is easier to reason about than before.

## Baseline

The original behavioral baseline is commit:

`48fa807` — `[GEB] baseline: Antithesis single-file`

Baseline source:

`antithesis_project1.jsx`

At baseline it contains 11,138 lines.

## Refactoring principle

> Modularize the code. Do not modularize away the runtime that makes Antithesis possible.

Every proposed architectural change should be checked against these constraints before implementation.
