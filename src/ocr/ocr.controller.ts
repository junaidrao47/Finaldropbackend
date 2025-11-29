import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { OcrService } from './ocr.service';
import { CloudinaryService, CloudinaryFolder, UploadType } from '../cloudinary';
import {
  OcrScanRequestDto,
  BarcodeScanRequestDto,
} from './dto/ocr.dto';

// File filter for label images
const imageFilter = (req: any, file: Express.Multer.File, callback: Function) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|pdf)$/)) {
    return callback(new BadRequestException('Only image and PDF files are allowed'), false);
  }
  callback(null, true);
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Controller('ocr')
@UseGuards(AuthGuard('jwt'))
export class OcrController {
  constructor(
    private readonly ocrService: OcrService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Scan shipping label image with OCR
   * POST /ocr/scan-label
   */
  @Post('scan-label')
  async scanShippingLabel(@Body() dto: OcrScanRequestDto) {
    return this.ocrService.scanShippingLabel(dto);
  }

  /**
   * Upload and scan shipping label image via Cloudinary
   * POST /ocr/upload-and-scan
   */
  @Post('upload-and-scan')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: imageFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadAndScanLabel(
    @UploadedFile() file: Express.Multer.File,
    @Body('organizationId') organizationId: string,
    @Body('packageId') packageId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Upload to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadFile(file, {
      folder: CloudinaryFolder.SHIPPING_LABELS,
      uploadType: UploadType.SHIPPING_LABEL,
      organizationId,
      packageId,
      tags: ['ocr', 'scan', 'shipping-label'],
    });

    // Scan the image (using the base64 data)
    const scanResult = await this.ocrService.scanShippingLabel({
      imageBase64: file.buffer.toString('base64'),
      organizationId,
    });

    return {
      upload: uploadResult,
      scan: scanResult,
    };
  }

  /**
   * Look up barcode / tracking number
   * POST /ocr/lookup-barcode
   */
  @Post('lookup-barcode')
  async lookupBarcode(@Body() dto: BarcodeScanRequestDto) {
    return this.ocrService.lookupBarcode(dto);
  }

  /**
   * Detect carrier from tracking number
   * GET /ocr/detect-carrier/:trackingNumber
   */
  @Get('detect-carrier/:trackingNumber')
  async detectCarrier(@Param('trackingNumber') trackingNumber: string) {
    return this.ocrService.detectCarrier(trackingNumber);
  }

  /**
   * Validate tracking number format
   * GET /ocr/validate/:trackingNumber
   */
  @Get('validate/:trackingNumber')
  async validateTrackingNumber(
    @Param('trackingNumber') trackingNumber: string,
    @Query('carrier') carrier?: string,
  ) {
    const isValid = this.ocrService.validateTrackingNumber(trackingNumber, carrier);
    const detection = this.ocrService.detectCarrier(trackingNumber);

    return {
      trackingNumber,
      isValid,
      detectedCarrier: detection.carrier,
      confidence: detection.confidence,
      expectedFormat: detection.carrier
        ? this.ocrService.getCarrierFormat(detection.carrier)
        : undefined,
    };
  }

  /**
   * Get carrier format info
   * GET /ocr/carrier-format/:carrier
   */
  @Get('carrier-format/:carrier')
  async getCarrierFormat(@Param('carrier') carrier: string) {
    return {
      carrier,
      format: this.ocrService.getCarrierFormat(carrier),
    };
  }

  /**
   * Batch validate tracking numbers
   * POST /ocr/batch-lookup
   */
  @Post('batch-lookup')
  async batchLookup(@Body() body: { barcodes: string[] }) {
    return this.ocrService.batchLookup(body.barcodes);
  }
}
