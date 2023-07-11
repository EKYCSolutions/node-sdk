
export interface CommonMLVisionParams {
  version?: 0;
  extraArgs?: {};
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

export interface LivenessDetectionSequence {
  video_url: string;
  checks: string;
}

export interface LivenessDetectionParams extends CommonMLVisionParams {
  sequences: LivenessDetectionSequence[];
}

export interface ManualKycParams extends CommonMLVisionParams {
  sequences: LivenessDetectionSequence[];
  faceImageUrl: string;
  ocrImageUrl: string;
  isRaw?: 'yes' | 'no';
  objectType: OcrObjectType;
}
