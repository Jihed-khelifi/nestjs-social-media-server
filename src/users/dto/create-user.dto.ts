import { IsString, IsEmail } from "class-validator";

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  country: string;

  @IsString()
  state: string;

  @IsString()
  city: string;
  
  location: LocationType;

  isProfessional?: boolean;
  professionalCode: string
}
export interface LocationType {
  type: string;
  coordinates: number[];
}