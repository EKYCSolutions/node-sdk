

import { Options } from 'got';

import { ApiResult, EkycClient } from '@ekycsolutions/client';

export interface CommonMLVisionParams {
  version?: 0;
}

export interface FaceCompareParams extends CommonMLVisionParams {
  face0Url: string;
  face1Url: string;
}

export enum OcrObjectType {
  nationalId = 'NATIONAL_ID_0',
}

export interface OcrParams extends CommonMLVisionParams {
  imageUrl: string;
  isRaw?: 'yes' | 'no';
  objectType: OcrObjectType;
}

export class MLVision {
  constructor(private readonly ekycClient: EkycClient) {}

  public async faceCompare({}: Readonly<FaceCompareParams>) {
  }

  public async ocr({ isRaw, imageUrl, objectType }: Readonly<OcrParams>): Promise<ApiResult> {
    const formData = this.ekycClient.prepareFormData();

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
}
