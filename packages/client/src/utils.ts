
import { EkycClientErrorCode } from './error-code.js';

export const sleep = (timeAsSec: number) =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve(true);
    }, timeAsSec * 1000);
  });

export const apiResultPolling = async ({ getRes, responseId, maxRequestTimeoutAsSec }) => {
  let waitTime = 0;
  let retryCount = 0;
  let waitTimeMultiplier = 0;

  while (true) {
    try {
      const res = await getRes();

      if (res?.result) {
        return {
          message: '',
          errorCode: '',
          isSuccess: true,
          endTime: res.service_usage.end_time,
          startTime: res.service_usage.start_time,
          data: { responseId, result: res.result },
          timeElapsedAsSec: (
            new Date(res.service_usage.end_time).getTime() - new Date(res.service_usage.start_time).getTime()) / 1000,
        };
      }

      if (res?.error?.code) {
        return {
          isSuccess: false,
          errorCode: res.error.code,
          message: res.error.message,
          data: { responseId, result: null },
          endTime: res.service_usage.end_time,
          startTime: res.service_usage.start_time,
          timeElapsedAsSec: (
            new Date(res.service_usage.end_time).getTime() - new Date(res.service_usage.start_time).getTime()) / 1000,
        };
      }

      const exp = Math.pow(1.32, waitTimeMultiplier);

      waitTime += exp;

      if (waitTime > maxRequestTimeoutAsSec) {
        return {
          isSuccess: false,
          data: { responseId, result: null },
          errorCode: EkycClientErrorCode.resultTimeout,
          message: `fail to wait for result due to "maxRequestTimeoutAsSec(${maxRequestTimeoutAsSec})" reached`,
          endTime: null,
          startTime: null,
          timeElapsedAsSec: null,
        };
      }

      await sleep(exp);

      retryCount += 1;

      waitTimeMultiplier = retryCount % 4;
    } catch (err) {
      return {
        isSuccess: false,
        data: { responseId, reuslt: null },
        message: err.toString(),
        errorCode: EkycClientErrorCode.unexpectedError,
        endTime: null,
        startTime: null,
        timeElapsedAsSec: null,
      };
    } 
  } 
};
