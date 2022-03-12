

import { Options } from 'got';
import FormData from 'form-data';

import { ApiResult, EkycClient } from '@ekycsolutions/client';

export interface CommonMLVisionParams {
  version?: 0;
}

export interface FaceCompareParams extends CommonMLVisionParams {
  face0Path: string;
  face1Path: string;
}

export enum OcrObjectType {
  nationalId = 'national-id',
}

export interface OcrParams extends CommonMLVisionParams {
  isRaw?: boolean;
  imageUrl: string;
  objectType: OcrObjectType;
}

export class MLVision {
  constructor(private readonly ekycClient: EkycClient) {}

  public async faceCompare({}: Readonly<FaceCompareParams>) {
  }

  public async ocr({ imageUrl, isRaw, objectType }: Readonly<OcrParams>): Promise<ApiResult> {
    const formData = new FormData();

    formData.append('is_raw', isRaw);
    formData.append('image_url', imageUrl);
    formData.append('object_type', objectType);

    const requestOpts = new Options({
      body: formData,
      headers: formData.getHeaders(),
    });

    return await this.ekycClient.makeRequest('/v0/ocr', requestOpts);
  }
}
