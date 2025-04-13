import { Pipe, PipeTransform } from '@angular/core';
import { Car } from '../../core/models/car.model';

interface CarFilters {
  seats?: number;
  gearbox?: string;
  fuelType?: string;
  ac?: boolean;
  electricWindows?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

@Pipe({
  name: 'filter',
  standalone: true
})
export class FilterPipe implements PipeTransform {
  transform(cars: Car[], filters: CarFilters): Car[] {
    if (!cars || !filters) {
      return cars;
    }

    return cars.filter(car => {
      // Handle seats filter
      if (filters.seats && car.specs?.seats !== undefined && car.specs.seats < filters.seats) {
        return false;
      }

      // Handle gearbox filter
      if (filters.gearbox && car.specs?.gearbox !== undefined && car.specs.gearbox !== filters.gearbox) {
        return false;
      }

      // Handle fuel type filter
      if (filters.fuelType && car.specs?.fuelType !== undefined && car.specs.fuelType !== filters.fuelType) {
        return false;
      }

      // Handle AC filter
      if (filters.ac !== undefined && car.specs?.ac !== undefined && car.specs.ac !== filters.ac) {
        return false;
      }

      // Handle electric windows filter
      if (filters.electricWindows !== undefined && car.specs?.electricWindows !== undefined && 
          car.specs.electricWindows !== filters.electricWindows) {
        return false;
      }

      // Handle price filters
      if (filters.minPrice && car.pricePerDay < filters.minPrice) {
        return false;
      }

      if (filters.maxPrice && car.pricePerDay > filters.maxPrice) {
        return false;
      }

      return true;
    });
  }
}
