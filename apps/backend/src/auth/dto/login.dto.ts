import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  identifier: string; // Can be email or phone

  @IsString()
  password: string;
}
