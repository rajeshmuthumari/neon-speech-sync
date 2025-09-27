-- Reset stuck processing analyses to allow them to be restarted
UPDATE analysis_results 
SET processing_status = 'error', 
    processing_error = 'Analysis restarted due to system improvements'
WHERE processing_status = 'processing' 
AND user_id = 'ff463363-250c-4f0c-8cca-7cbf9b3b9dd8';