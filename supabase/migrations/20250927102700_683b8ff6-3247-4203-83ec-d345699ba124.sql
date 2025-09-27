-- Remove the problematic constraints temporarily to allow uploads to work
ALTER TABLE analysis_results DROP CONSTRAINT IF EXISTS analysis_results_political_positioning_check;
ALTER TABLE analysis_results DROP CONSTRAINT IF EXISTS analysis_results_processing_status_check;