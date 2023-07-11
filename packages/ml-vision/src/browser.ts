
import { ApiResult } from '@ekycsolutions/client';
import { EkycClientBrowser } from '@ekycsolutions/client/dist/browser';
import {
  OcrParams,
  OcrObjectType,
  FaceCompareParams,
  IdDetectionParams,
  CommonMLVisionParams,
  LivenessDetectionParams,
} from './interface.js';

export * from './interface.js';

export interface ManualKycParamsWithImage extends CommonMLVisionParams {
  ocrImage: File;
  faceImage: File;
  isRaw?: 'yes' | 'no';
  objectType: OcrObjectType;
  sequences: { checks: string; video: File; }[];
}

export class MLVisionBrowser {
  constructor(private readonly ekycClient: EkycClientBrowser) { }

  public async faceCompare({ faceImage0Url, faceImage1Url }: Readonly<FaceCompareParams>) {
    const formData = this.ekycClient.prepareFormData({
      api: 'face-compare',
      version: 'v0',
    });

    formData.append('face_image_0_url', faceImage0Url);
    formData.append('face_image_1_url', faceImage1Url);

    return await this.ekycClient.makeRequest('v0/face-compare', formData);
  }

  public async ocr({ isRaw, imageUrl, objectType }: Readonly<OcrParams>): Promise<ApiResult> {
    const formData = this.ekycClient.prepareFormData({
      api: 'ocr',
      version: 'v0',
    });

    formData.append('is_raw', isRaw);
    formData.append('image_url', imageUrl);
    formData.append('object_type', objectType);

    return await this.ekycClient.makeRequest('v0/ocr', formData);
  }

  public async idDetection({ imageUrl }: Readonly<IdDetectionParams>): Promise<ApiResult> {
    const formData = this.ekycClient.prepareFormData({
      api: 'id-detection',
      version: 'v0',
    });

    formData.append('image_url', imageUrl);

    return await this.ekycClient.makeRequest('v0/id-detection', formData);
  }

  public async livenessDetection({ sequences }: Readonly<LivenessDetectionParams>): Promise<ApiResult> {
    const formData = this.ekycClient.prepareFormData({
      api: 'liveness-detection',
      version: 'v0',
    });

    for (let index = 0; index < sequences.length; index++) {
      const sequence = sequences[index];

      formData.append(`sequences[${index}][checks]`, sequence.checks);
      formData.append(`sequences[${index}][video_url]`, sequence.video_url);
    }

    return await this.ekycClient.makeRequest('v0/liveness-detection', formData);
  }

  public async manualKyc({ isRaw, ocrImage, faceImage, objectType, sequences }: Readonly<ManualKycParamsWithImage>): Promise<ApiResult> {
    const formData = this.ekycClient.prepareFormData({
      api: 'manual-kyc',
      version: 'v0',
    });

    formData.append('is_raw', isRaw);
    formData.append('object_type', objectType);
    formData.append('ocr_image', ocrImage);
    formData.append('face_image', faceImage);

    for (let index = 0; index < sequences.length; index++) {
      const sequence = sequences[index];

      formData.append(`sequences[${index}][video]`, sequence.video);
      formData.append(`sequences[${index}][checks]`, sequence.checks);
    }

    return await this.ekycClient.makeRequest('v0/manual-kyc', formData);
  }
}
