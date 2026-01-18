import { IsNumber, Min, Max } from 'class-validator';

export class AcceptOrderDto {
  @IsNumber()
  @Min(5)
  @Max(120)
  estimatedPrepTime: number; // in minutes
}