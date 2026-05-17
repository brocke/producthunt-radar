-- KOE-357: the three default-lens prompts were rewritten as shorter
-- persona-anchored templates. Existing cached scores were produced
-- against the old prompts and would now be misleading, so we wipe the
-- default-lens cache. Custom lenses (lens_key starting with "custom:")
-- stay untouched. The first activation of each default lens after this
-- migration will re-score (~2.4 ¢ per batch).
DELETE FROM `lens_scores` WHERE `lens_key` IN ('workflow', 'replicate', 'discuss');
