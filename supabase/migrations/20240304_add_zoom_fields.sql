-- Add Zoom meeting fields to study_sessions table
ALTER TABLE study_sessions 
ADD COLUMN zoom_meeting_id TEXT,
ADD COLUMN zoom_join_url TEXT,
ADD COLUMN zoom_password TEXT,
ADD COLUMN zoom_host_url TEXT;

-- Add index for zoom_meeting_id for faster lookups
CREATE INDEX idx_study_sessions_zoom_meeting_id ON study_sessions(zoom_meeting_id);

-- Add comment to describe the new fields
COMMENT ON COLUMN study_sessions.zoom_meeting_id IS 'Zoom meeting ID for online sessions';
COMMENT ON COLUMN study_sessions.zoom_join_url IS 'Direct join URL for Zoom meeting';
COMMENT ON COLUMN study_sessions.zoom_password IS 'Password for Zoom meeting (if any)';
COMMENT ON COLUMN study_sessions.zoom_host_url IS 'Host URL for Zoom meeting';
