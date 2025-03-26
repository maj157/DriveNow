import { Pipe, PipeTransform } from '@angular/core';
import { Car } from '../../core/models/car.model';

@Pipe({
  name: 'filter',
  pure: false,
  standalone: true
})
export class FilterPipe implements PipeTransform {
  transform(cars: Car[] | null, filters: {
    seats?: number;
    gearbox?: 'Automatic' | 'Manual';
    fuelType?: string;
    ac?: boolean;
    electricWindows?: boolean;
    minPrice?: number;
    maxPrice?: number;
  }): Car[] {
    if (!cars || !filters) {
      return cars || [];
    }

    return cars.filter(car => {
      // Check each filter criterion
      if (filters.seats && car.specs.seats < filters.seats) {
        return false;
      }

      if (filters.gearbox && car.specs.gearbox !== filters.gearbox) {
        return false;
      }

      if (filters.fuelType && car.specs.fuelType !== filters.fuelType) {
        return false;
      }

      if (filters.ac !== undefined && car.specs.ac !== filters.ac) {
        return false;
      }

      if (filters.electricWindows !== undefined && car.specs.electricWindows !== filters.electricWindows) {
        return false;
      }

      if (filters.minPrice && car.price < filters.minPrice) {
        return false;
      }

      if (filters.maxPrice && car.price > filters.maxPrice) {
        return false;
      }

      // Car passed all filters
      return true;
    });
  }
}
