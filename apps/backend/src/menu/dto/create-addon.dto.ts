import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateAddonDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}