

import { Options } from 'got';

import { ApiResult, EkycClient } from '@ekycsolutions/client';

export interface CommonMLVisionParams {
  version?: 0;
}

export interface FaceCompareParams extends CommonMLVisionParams {
  faceImage0Url: string;
  faceImage1Url: string;
}

export enum OcrObjectType {
  nationalId = 'NATIONAL_ID_0',
}

export interface OcrParams extends CommonMLVisionParams {
  imageUrl: string;
  isRaw?: 'yes' | 'no';
  objectType: OcrObjectType;
}

export interface IdDetectionParams extends CommonMLVisionParams {
  imageUrl: string;
}

export class MLVision {
  constructor(private readonly ekycClient: EkycClient) {}

  public async faceCompare({ faceImage0Url, faceImage1Url }: Readonly<FaceCompareParams>) {
    const formData = this.ekycClient.prepareFormData({
      api: 'ocr',
      version: 'v0',
    });

    formData.append('face_image_0_url', faceImage0Url);
    formData.append('face_image_1_url', faceImage1Url);

    const requestOpts = new Options({
      body: formData,
      method: 'POST',
      headers: formData.getHeaders(),
    });

    return await this.ekycClient.makeRequest('v0/face-compare', requestOpts);
  }

  public async ocr({ isRaw, imageUrl, objectType }: Readonly<OcrParams>): Promise<ApiResult> {
    const formData = this.ekycClient.prepareFormData({
      api: 'ocr',
      version: 'v0',
    });

    formData.append('is_raw', isRaw);
    formData.append('image_url', imageUrl);
    formData.append('object_type', objectType);

    const requestOpts = new Options({
      body: formData,
      method: 'POST',
      headers: formData.getHeaders(),
    });

    return await this.ekycClient.makeRequest('v0/ocr', requestOpts);
  }

  public async idDetection({ imageUrl }: Readonly<IdDetectionParams>): Promise<ApiResult> {
    const formData = this.ekycClient.prepareFormData({
      api: 'id-detection',
      version: 'v0',
    });

    formData.append('image_url', imageUrl);

    const requestOpts = new Options({
      body: formData,
      method: 'POST',
      headers: formData.getHeaders(),
    });

    return await this.ekycClient.makeRequest('v0/id-detection', requestOpts);
  }
}
