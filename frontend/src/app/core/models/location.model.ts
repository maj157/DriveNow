export interface Location {
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  open: string;
  close: string;
  phone: string;
}