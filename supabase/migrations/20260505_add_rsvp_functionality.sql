-- Create RSVP table for study session attendance tracking
CREATE TABLE session_rsvps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('attending', 'maybe', 'not_attending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user can only RSVP once per session
    UNIQUE(session_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_session_rsvps_session_id ON session_rsvps(session_id);
CREATE INDEX idx_session_rsvps_user_id ON session_rsvps(user_id);
CREATE INDEX idx_session_rsvps_status ON session_rsvps(status);

-- Add comments to describe the table and columns
COMMENT ON TABLE session_rsvps IS 'Tracks user RSVP responses for study sessions';
COMMENT ON COLUMN session_rsvps.session_id IS 'Reference to the study session';
COMMENT ON COLUMN session_rsvps.user_id IS 'Reference to the user who RSVPed';
COMMENT ON COLUMN session_rsvps.status IS 'RSVP status: attending, maybe, or not_attending';
COMMENT ON COLUMN session_rsvps.created_at IS 'When the RSVP was created';
COMMENT ON COLUMN session_rsvps.updated_at IS 'When the RSVP was last updated';

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_session_rsvps_updated_at 
    BEFORE UPDATE ON session_rsvps 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to check if user is group member before allowing RSVP
CREATE OR REPLACE FUNCTION can_rsvp_to_session()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the user is a member of the group that owns this session
    IF NOT EXISTS (
        SELECT 1 FROM group_members gm
        JOIN study_sessions ss ON gm.group_id = ss.group_id
        WHERE gm.user_id = NEW.user_id AND ss.id = NEW.session_id
    ) THEN
        RAISE EXCEPTION 'User must be a group member to RSVP to session';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to enforce group membership before RSVP
CREATE TRIGGER check_group_membership_before_rsvp
    BEFORE INSERT OR UPDATE ON session_rsvps
    FOR EACH ROW
    EXECUTE FUNCTION can_rsvp_to_session();
