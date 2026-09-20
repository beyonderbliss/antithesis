# Antithesis — Architecture Notes

## Runtime boundary

Antithesis is designed to run inside Gemini Canvas. Gemini Canvas is a required runtime environment because it provides access to multimodal Gemini capabilities without requiring the user to supply their own Gemini API key.

That capability is part of the application's architecture, not an incidental development convenience.

Therefore, modularization must preserve this boundary:

Gemini Canvas
  -> Canvas-provided AI capability
  -> Antithesis AI/runtime integration
  -> generation / inpainting / orchestration
  -> UI

## Refactoring objective

The current application is a single-file implementation. The repository's architectural work is intended to extract coherent modules, services, components, and utilities from that implementation without changing observable behavior.

The target is:

single-file application
  -> structured internal modules
  -> same Gemini Canvas runtime
  -> same capabilities
  -> same behavior

The target is NOT:

Gemini Canvas application
  -> standalone web application
  -> replacement image-generation backend

## Baseline

Commit: 48fa807
Message: [GEB] baseline: Antithesis single-file
Source: antithesis_project1.jsx
Lines: 11,138

The baseline is the recovery point for behavioral comparison during refactoring.
