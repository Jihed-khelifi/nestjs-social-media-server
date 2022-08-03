export class CreateUserDto {
  name: string;
  email: string;
  username: string;
  password: string;
  country: string;
  state: string;
  city: string;
  location: LocationType;
}
export interface LocationType {
  type: string;
  coordinates: number[];
}