import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '../../../core/models/reservation.model';

// Import Google Maps Types
declare const google: any;

@Component({
  selector: 'app-map-selector',
  templateUrl: './map-selector.component.html',
  styleUrls: ['./map-selector.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class MapSelectorComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() branches: Location[] = [];
  @Input() selectedPickup: string = '';
  @Input() selectedReturn: string = '';
  @Output() branchClicked = new EventEmitter<Location>();

  filteredBranches: Location[] = [];
  private map: any;
  private markers: any[] = [];
  private infoWindows: any[] = [];
  private selectedPickupMarker: any = null;
  private selectedReturnMarker: any = null;
  private locationSelectedListener: any;
  private API_KEY = 'AIzaSyDhGcGam05FfLmQvP4aaai-YduwE1yCyJ0';

  constructor() {
    this.filteredBranches = this.branches;
  }

  ngOnInit(): void {
    this.loadGoogleMapsScript();
    this.setupEventListeners();
    this.filteredBranches = this.branches;
  }

  ngAfterViewInit(): void {
    // Map will be initialized via the callback after script loads
  }

  ngOnChanges(): void {
    if (this.map) {
      this.updateSelectedMarkers();
    }
    
    // Update filtered branches when input branches change
    this.filteredBranches = this.branches;
  }

  ngOnDestroy(): void {
    this.cleanupEventListeners();
  }

  /**
   * Filter branches based on search input
   */
  filterBranches(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredBranches = this.branches;
      return;
    }
    
    const term = searchTerm.toLowerCase();
    this.filteredBranches = this.branches.filter(branch => 
      branch.name.toLowerCase().includes(term) || 
      branch.address.toLowerCase().includes(term)
    );
  }

  private setupEventListeners(): void {
    // Add window functions for Google Maps info window button clicks
    (window as any).selectBranch = (branchName: string) => {
      const branch = this.branches.find(b => b.name === branchName);
      if (branch) {
        this.branchClicked.emit(branch);
      }
    };
  }

  private cleanupEventListeners(): void {
    // Remove global functions when component is destroyed
    if ((window as any).selectBranch) {
      delete (window as any).selectBranch;
    }
  }

  private loadGoogleMapsScript(): void {
    if (typeof google !== 'undefined' && google.maps) {
      this.initializeMap();
      return;
    }

    // Define the callback function
    (window as any).initMap = () => {
      this.initializeMap();
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${this.API_KEY}&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  private initializeMap(): void {
    // Wait for the DOM to be ready
    if (!document.getElementById('map')) {
      setTimeout(() => this.initializeMap(), 100);
      return;
    }

    // Initialize the map centered on Charlotte, NC by default
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 35.2271, lng: -80.8431 },
      zoom: 10,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      styles: this.getMapStyles()
    });
    
    // Add markers for branches
    this.addBranchMarkers();
  }

  private addBranchMarkers(): void {
    // Clear existing markers
    this.clearMarkers();
    
    if (!this.branches || this.branches.length === 0) {
      return;
    }
    
    // Create bounds to fit all markers
    const bounds = new google.maps.LatLngBounds();
    
    // Add markers for each branch
    this.branches.forEach(branch => {
      // Get coordinates
      let lat = 0;
      let lng = 0;
      
      // Handle different location models (some have coordinates property, some have latitude/longitude)
      if ('coordinates' in branch && branch.coordinates) {
        lat = branch.coordinates.lat;
        lng = branch.coordinates.lng;
      } else if ('latitude' in branch && 'longitude' in branch) {
        lat = (branch as any).latitude;
        lng = (branch as any).longitude;
      }
      
      // Skip if no valid coordinates
      if (!lat || !lng) return;
      
      // Create marker
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: this.map,
        title: branch.name,
        animation: google.maps.Animation.DROP,
        icon: this.getMarkerIcon(branch.name)
      });
      
      // Create info window
      const infoWindow = new google.maps.InfoWindow({
        content: this.createInfoWindowContent(branch)
      });
      
      // Add click listener
      marker.addListener('click', () => {
        // Close all open info windows
        this.infoWindows.forEach(iw => iw.close());
        
        // Open this info window
        infoWindow.open(this.map, marker);
        
        // Emit branch clicked event
        this.branchClicked.emit(branch);
      });
      
      // Store marker and info window
      this.markers.push(marker);
      this.infoWindows.push(infoWindow);
      
      // Extend bounds
      bounds.extend(new google.maps.LatLng(lat, lng));
    });
    
    // Fit map to bounds if we have markers
    if (this.markers.length > 0) {
      this.map.fitBounds(bounds);
      
      // Don't zoom in too far
      google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => {
        if (this.map.getZoom() > 15) {
          this.map.setZoom(15);
        }
      });
    }
    
    // Update markers based on selected locations
    this.updateSelectedMarkers();
  }

  private createInfoWindowContent(branch: Location): string {
    return `
      <div class="marker-popup">
        <h3>${branch.name}</h3>
        <p>${branch.address}</p>
        <p>${(branch as any).phoneNumber || ''}</p>
        <button 
          class="map-popup-button" 
          onclick="selectBranch('${branch.name}')">
          Select This Location
        </button>
      </div>
    `;
  }

  private clearMarkers(): void {
    // Clear all markers and info windows
    this.markers.forEach(marker => {
      marker.setMap(null);
    });
    
    this.markers = [];
    this.infoWindows = [];
    this.selectedPickupMarker = null;
    this.selectedReturnMarker = null;
  }

  private updateSelectedMarkers(): void {
    // Reset all markers to default icon
    this.markers.forEach(marker => {
      marker.setIcon(this.getDefaultIcon());
    });
    
    // Update pickup marker
    if (this.selectedPickup) {
      const pickupMarker = this.markers.find(marker => marker.getTitle() === this.selectedPickup);
      if (pickupMarker) {
        pickupMarker.setIcon(this.getPickupIcon());
        this.selectedPickupMarker = pickupMarker;
      }
    }
    
    // Update return marker
    if (this.selectedReturn) {
      const returnMarker = this.markers.find(marker => marker.getTitle() === this.selectedReturn);
      if (returnMarker) {
        returnMarker.setIcon(this.getReturnIcon());
        this.selectedReturnMarker = returnMarker;
      }
    }
  }
  
  private getMarkerIcon(branchName: string): any {
    if (branchName === this.selectedPickup) {
      return this.getPickupIcon();
    } else if (branchName === this.selectedReturn) {
      return this.getReturnIcon();
    } else {
      return this.getDefaultIcon();
    }
  }
  
  private getDefaultIcon(): any {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#3f51b5',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 10
    };
  }
  
  private getPickupIcon(): any {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#4caf50',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 12
    };
  }
  
  private getReturnIcon(): any {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#2196f3',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 12
    };
  }
  
  private getMapStyles(): any[] {
    return [
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#e9e9e9' }, { lightness: 17 }]
      },
      {
        featureType: 'landscape',
        elementType: 'geometry',
        stylers: [{ color: '#f5f5f5' }, { lightness: 20 }]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry.fill',
        stylers: [{ color: '#ffffff' }, { lightness: 17 }]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#ffffff' }, { lightness: 29 }, { weight: 0.2 }]
      },
      {
        featureType: 'road.arterial',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }, { lightness: 18 }]
      },
      {
        featureType: 'road.local',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }, { lightness: 16 }]
      },
      {
        featureType: 'poi',
        elementType: 'geometry',
        stylers: [{ color: '#f5f5f5' }, { lightness: 21 }]
      },
      {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{ color: '#dedede' }, { lightness: 21 }]
      }
    ];
  }
}

