
export interface PrepareFormDataMeta {
  api: string;
  version: string;
}

export interface ApiResult {
  data: any;
  message: string;
  errorCode: string;
  isSuccess: boolean;
  endTime: string;
  startTime: string;
  timeElapsedAsSec: number;
}

export interface ApiResultResponse {
  result: any;
  error: {
    code: string;
    message: string;
  };
  service_usage: {
    id: string;
    end_time: string;
    start_time: string;
    inserted_at: string;
    is_success: boolean;
  };
}
