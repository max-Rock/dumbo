import { IsInt, IsString, IsBoolean, Min, Max } from 'class-validator';

export class OperatingHoursDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number; // 0=Sunday, 6=Saturday

  @IsString()
  openTime: string; // "09:00"

  @IsString()
  closeTime: string; // "22:00"

  @IsBoolean()
  isClosed: boolean;
}