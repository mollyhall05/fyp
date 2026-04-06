export interface ZoomError {
  code: string;
  message: string;
  details?: any;
}

export class ZoomErrorHandler {
  static handle(error: any): ZoomError {
    console.error('Zoom API Error:', error);

    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to Zoom. Please check your internet connection.',
        details: error
      };
    }

    // Authentication errors
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      return {
        code: 'AUTH_ERROR',
        message: 'Zoom authentication failed. Please check your API credentials.',
        details: error
      };
    }

    // Rate limiting
    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      return {
        code: 'RATE_LIMIT',
        message: 'Too many requests to Zoom. Please try again in a few minutes.',
        details: error
      };
    }

    // Invalid meeting data
    if (error.message?.includes('400') || error.message?.includes('Invalid')) {
      return {
        code: 'INVALID_DATA',
        message: 'Invalid meeting data. Please check your session details.',
        details: error
      };
    }

    // Account limits
    if (error.message?.includes('402') || error.message?.includes('payment')) {
      return {
        code: 'ACCOUNT_LIMIT',
        message: 'Zoom account limit reached. Please upgrade your Zoom plan.',
        details: error
      };
    }

    // Generic API error
    return {
      code: 'API_ERROR',
      message: 'Zoom API error occurred. Please try again.',
      details: error
    };
  }

  static getUserFriendlyMessage(error: ZoomError): string {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Connection issue - please check your internet and try again';
      case 'AUTH_ERROR':
        return 'Zoom service is temporarily unavailable - please try manual link';
      case 'RATE_LIMIT':
        return 'Too many meeting requests - please wait a moment and try again';
      case 'INVALID_DATA':
        return 'Session details need adjustment - please check and retry';
      case 'ACCOUNT_LIMIT':
        return 'Zoom plan limit reached - please use manual meeting link';
      default:
        return 'Zoom meeting creation failed - you can add a manual link instead';
    }
  }

  static shouldRetry(error: ZoomError): boolean {
    // Retry on network errors and rate limiting
    return error.code === 'NETWORK_ERROR' || error.code === 'RATE_LIMIT';
  }
}
