import { ZoomErrorHandler, ZoomError } from './zoom-error-handler';

interface ZoomMeeting {
  id: string;
  topic: string;
  type: number;
  start_time: string;
  duration: number;
  settings: {
    join_before_host: boolean;
    participant_video: boolean;
    host_video: boolean;
    mute_upon_entry: boolean;
    watermark: boolean;
    use_pmi: boolean;
    approval_type: number;
    audio: string;
    auto_recording: string;
    enforce_login: boolean;
    close_registration: boolean;
    waiting_room: boolean;
    allow_multiple_devices: boolean;
    registrants_email_notification: boolean;
  };
  join_url: string;
  password?: string;
}

interface ZoomUser {
  id: string;
  email: string;
  type: number;
  pmi: number;
  timezone: string;
  verified: number;
  created_at: string;
  last_login_time: string;
  last_name: string;
  first_name: string;
  pic_url: string;
  language: string;
  phone_number: string;
  status: number;
  role_id: number;
}

class ZoomService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private maxRetries = 3;
  private retryDelay = 1000;

  private async getAccessToken(): Promise<string> {
    // Check if current token is still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const accountId = import.meta.env.VITE_ZOOM_ACCOUNT_ID;
      const clientId = import.meta.env.VITE_ZOOM_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_ZOOM_CLIENT_SECRET;

      if (!accountId || !clientId || !clientSecret) {
        throw new Error('Zoom API credentials not configured');
      }

      const response = await fetch('https://zoom.us/oauth/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=account_credentials&account_id=' + accountId
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Zoom auth failed: ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute early

      return this.accessToken;
    } catch (error: any) {
      const zoomError = ZoomErrorHandler.handle(error);
      throw zoomError;
    }
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    retries: number = this.maxRetries
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      const zoomError = error as ZoomError;
      
      if (retries > 0 && ZoomErrorHandler.shouldRetry(zoomError)) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (this.maxRetries - retries + 1)));
        return this.retryWithBackoff(operation, retries - 1);
      }
      
      throw zoomError;
    }
  }

  async createMeeting(meetingData: {
    topic: string;
    start_time: string;
    duration: number;
    agenda?: string;
  }): Promise<ZoomMeeting> {
    return this.retryWithBackoff(async () => {
      try {
        const token = await this.getAccessToken();
        
        // Validate meeting data
        if (!meetingData.topic?.trim()) {
          throw new Error('Meeting topic is required');
        }
        if (!meetingData.start_time) {
          throw new Error('Meeting start time is required');
        }
        if (!meetingData.duration || meetingData.duration < 15 || meetingData.duration > 480) {
          throw new Error('Meeting duration must be between 15 and 480 minutes');
        }

        const payload = {
          topic: meetingData.topic.trim(),
          type: 2, // Scheduled meeting
          start_time: meetingData.start_time,
          duration: meetingData.duration,
          agenda: meetingData.agenda?.trim() || '',
          settings: {
            join_before_host: true,
            participant_video: true,
            host_video: true,
            mute_upon_entry: false,
            watermark: false,
            use_pmi: false,
            approval_type: 2,
            audio: 'both',
            auto_recording: 'none',
            enforce_login: false,
            close_registration: true,
            waiting_room: false,
            allow_multiple_devices: true,
            registrants_email_notification: false
          }
        };

        // Get the first user (typically the account owner) to create meetings for
        const usersResponse = await fetch('https://api.zoom.us/v2/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!usersResponse.ok) {
          const errorData = await usersResponse.json().catch(() => ({}));
          throw new Error(`Failed to get Zoom users: ${errorData.message || 'Unknown error'}`);
        }

        const usersData = await usersResponse.json();
        const userId = usersData.users?.[0]?.id;

        if (!userId) {
          throw new Error('No Zoom user found to create meeting');
        }

        const response = await fetch(`https://api.zoom.us/v2/users/${userId}/meetings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to create Zoom meeting: ${errorData.message || errorData.code || 'Unknown error'}`);
        }

        const meeting = await response.json();
        return meeting;
      } catch (error: any) {
        throw ZoomErrorHandler.handle(error);
      }
    });
  }

  async getMeeting(meetingId: string): Promise<ZoomMeeting> {
    try {
      const token = await this.getAccessToken();
      
      if (!meetingId?.trim()) {
        throw new Error('Meeting ID is required');
      }
      
      const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to get Zoom meeting: ${errorData.message || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error: any) {
      throw ZoomErrorHandler.handle(error);
    }
  }

  async updateMeeting(meetingId: string, updateData: Partial<ZoomMeeting>): Promise<ZoomMeeting> {
    try {
      const token = await this.getAccessToken();
      
      if (!meetingId?.trim()) {
        throw new Error('Meeting ID is required');
      }
      
      const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to update Zoom meeting: ${errorData.message || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error: any) {
      throw ZoomErrorHandler.handle(error);
    }
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    try {
      const token = await this.getAccessToken();
      
      if (!meetingId?.trim()) {
        throw new Error('Meeting ID is required');
      }
      
      const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to delete Zoom meeting: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      throw ZoomErrorHandler.handle(error);
    }
  }

  generateJoinUrl(meetingId: string, password?: string): string {
    const baseUrl = `https://zoom.us/j/${meetingId}`;
    return password ? `${baseUrl}?pwd=${password}` : baseUrl;
  }

  // Test method to verify Zoom API credentials
  async testConnection(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      console.error('Zoom connection test failed:', error);
      return false;
    }
  }
}

export const zoomService = new ZoomService();
export type { ZoomMeeting, ZoomUser };
