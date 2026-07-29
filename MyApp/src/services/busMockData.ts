export interface BusVehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  capacity: number;
  gpsTrackingMethod: 'phone' | 'dedicated';
  status: 'Active' | 'In Maintenance' | 'Offline';
  assignedDriver?: string;
  assignedRoute?: string;
  lastLocation?: string;
  speedKmH?: number;
}

export interface BusRouteStop {
  id: string;
  sequence: number;
  name: string;
  address: string;
  eta: string;
  geofenceRadiusMeters: number;
}

export interface BusRoute {
  id: string;
  code: string;
  name: string;
  type: 'Pickup' | 'Drop-off' | 'Both';
  healthPercent: number;
  estDurationMinutes: number;
  stopCount: number;
  stops: BusRouteStop[];
  isLive: boolean;
}

export interface BusSchedule {
  id: string; // e.g. SCH-8942-X
  busId: string;
  busRegistration: string;
  routeId: string;
  routeName: string;
  driverId: string;
  driverName: string;
  tripType: 'Morning Pickup' | 'Afternoon Drop';
  departureTime: string;
  arrivalTime: string;
  daysOfWeek: string[]; // ['MON', 'TUE', 'WED', 'THU', 'FRI']
  status: 'Active' | 'Scheduled' | 'Completed';
  effectiveFrom: string;
  effectiveTo: string;
}

export interface BusDriver {
  id: string; // e.g. DRV-401
  fullName: string;
  initials: string;
  email: string;
  phone: string;
  emergencyContact: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseType: 'LMV' | 'HMV' | 'HPMV' | 'PSV';
  assignedBusReg?: string;
  assignedRouteName?: string;
  rating: number;
  totalTrips: number;
  status: 'On Duty' | 'Off Duty' | 'On Leave';
}

export interface StudentEnrollment {
  id: string;
  studentId: string;
  studentName: string;
  scheduleId: string;
  routeName: string;
  boardingStop: string;
  dropStop: string;
  enrolledAt: string;
}

// Initial Mock Datasets
let mockBuses: BusVehicle[] = [
  {
    id: 'bus-1',
    registrationNumber: 'KA-01-EQ-9842',
    make: 'Ashok Leyland',
    model: 'Falcon 2023',
    capacity: 42,
    gpsTrackingMethod: 'dedicated',
    status: 'Active',
    assignedDriver: 'Rajesh Kumar',
    assignedRoute: 'Route A - Northern Express',
    lastLocation: 'MG Road Junction',
    speedKmH: 34,
  },
  {
    id: 'bus-2',
    registrationNumber: 'KA-01-EQ-4120',
    make: 'Tata Motors',
    model: 'Starbus 2022',
    capacity: 36,
    gpsTrackingMethod: 'phone',
    status: 'Active',
    assignedDriver: 'Suresh Verma',
    assignedRoute: 'Route B - Suburban Loop',
    lastLocation: 'Indiranagar 100ft Rd',
    speedKmH: 28,
  },
  {
    id: 'bus-3',
    registrationNumber: 'KA-01-EQ-1099',
    make: 'Eicher Motors',
    model: 'Skyline Pro 2024',
    capacity: 48,
    gpsTrackingMethod: 'dedicated',
    status: 'In Maintenance',
    assignedDriver: 'Ramesh Patel',
    assignedRoute: 'Route C - Eastern Flyer',
    lastLocation: 'Depot #2 Workshop',
    speedKmH: 0,
  },
];

let mockRoutes: BusRoute[] = [
  {
    id: 'route-1',
    code: 'RT-NORTH-01',
    name: 'Northern Express Corridor',
    type: 'Pickup',
    healthPercent: 98,
    estDurationMinutes: 45,
    stopCount: 6,
    isLive: true,
    stops: [
      { id: 'st-1', sequence: 1, name: 'Hebbal Flyover Circle', address: 'Hebbal Main Rd, Sector 1', eta: '07:15 AM', geofenceRadiusMeters: 150 },
      { id: 'st-2', sequence: 2, name: 'RT Nagar Post Office', address: '8th Main Rd, RT Nagar', eta: '07:25 AM', geofenceRadiusMeters: 100 },
      { id: 'st-3', sequence: 3, name: 'Cantonment Station', address: 'Station Rd, Vasanth Nagar', eta: '07:38 AM', geofenceRadiusMeters: 120 },
      { id: 'st-4', sequence: 4, name: 'School Main Gate', address: 'Campus Central Arch', eta: '07:55 AM', geofenceRadiusMeters: 200 },
    ],
  },
  {
    id: 'route-2',
    code: 'RT-SUBURB-02',
    name: 'Suburban Loop South',
    type: 'Drop-off',
    healthPercent: 92,
    estDurationMinutes: 50,
    stopCount: 5,
    isLive: true,
    stops: [
      { id: 'st-5', sequence: 1, name: 'School Gate #2', address: 'Campus South Exit', eta: '02:30 PM', geofenceRadiusMeters: 200 },
      { id: 'st-6', sequence: 2, name: 'Jayanagar 4th Block', address: 'Shopping Complex Circle', eta: '02:48 PM', geofenceRadiusMeters: 100 },
      { id: 'st-7', sequence: 3, name: 'JP Nagar Metro Stn', address: 'Outer Ring Rd', eta: '03:05 PM', geofenceRadiusMeters: 150 },
    ],
  },
  {
    id: 'route-3',
    code: 'RT-EAST-03',
    name: 'Eastern Flyer Direct',
    type: 'Both',
    healthPercent: 88,
    estDurationMinutes: 40,
    stopCount: 4,
    isLive: false,
    stops: [
      { id: 'st-8', sequence: 1, name: 'Whitefield Central', address: 'ITPL Main Rd', eta: '07:00 AM', geofenceRadiusMeters: 150 },
      { id: 'st-9', sequence: 2, name: 'Marathahalli Bridge', address: 'Outer Ring Rd', eta: '07:20 AM', geofenceRadiusMeters: 120 },
      { id: 'st-10', sequence: 3, name: 'School Main Campus', address: 'Central Gate', eta: '07:45 AM', geofenceRadiusMeters: 200 },
    ],
  },
];

let mockSchedules: BusSchedule[] = [
  {
    id: 'SCH-8942-X',
    busId: 'bus-1',
    busRegistration: 'KA-01-EQ-9842',
    routeId: 'route-1',
    routeName: 'Northern Express Corridor',
    driverId: 'drv-1',
    driverName: 'Rajesh Kumar',
    tripType: 'Morning Pickup',
    departureTime: '07:15 AM',
    arrivalTime: '08:00 AM',
    daysOfWeek: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    status: 'Active',
    effectiveFrom: '2026-06-01',
    effectiveTo: '2026-12-31',
  },
  {
    id: 'SCH-4120-Y',
    busId: 'bus-2',
    busRegistration: 'KA-01-EQ-4120',
    routeId: 'route-2',
    routeName: 'Suburban Loop South',
    driverId: 'drv-2',
    driverName: 'Suresh Verma',
    tripType: 'Afternoon Drop',
    departureTime: '02:30 PM',
    arrivalTime: '03:20 PM',
    daysOfWeek: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    status: 'Active',
    effectiveFrom: '2026-06-01',
    effectiveTo: '2026-12-31',
  },
];

let mockDrivers: BusDriver[] = [
  {
    id: 'DRV-401',
    fullName: 'Rajesh Kumar',
    initials: 'RK',
    email: 'rajesh.k@sharnexbus.com',
    phone: '+91 98765 43210',
    emergencyContact: '+91 98765 00001 (Wife)',
    licenseNumber: 'KA-01-20180049210',
    licenseExpiry: '2029-08-15',
    licenseType: 'HMV',
    assignedBusReg: 'KA-01-EQ-9842',
    assignedRouteName: 'Northern Express Corridor',
    rating: 4.9,
    totalTrips: 342,
    status: 'On Duty',
  },
  {
    id: 'DRV-402',
    fullName: 'Suresh Verma',
    initials: 'SV',
    email: 'suresh.v@sharnexbus.com',
    phone: '+91 98123 45678',
    emergencyContact: '+91 98123 99999 (Brother)',
    licenseNumber: 'KA-02-20190012389',
    licenseExpiry: '2028-11-20',
    licenseType: 'HPMV',
    assignedBusReg: 'KA-01-EQ-4120',
    assignedRouteName: 'Suburban Loop South',
    rating: 4.8,
    totalTrips: 289,
    status: 'On Duty',
  },
  {
    id: 'DRV-403',
    fullName: 'Ramesh Patel',
    initials: 'RP',
    email: 'ramesh.p@sharnexbus.com',
    phone: '+91 97456 78901',
    emergencyContact: '+91 97456 11111 (Son)',
    licenseNumber: 'KA-03-20170098451',
    licenseExpiry: '2027-04-10',
    licenseType: 'PSV',
    assignedBusReg: 'KA-01-EQ-1099',
    assignedRouteName: 'Eastern Flyer Direct',
    rating: 4.7,
    totalTrips: 198,
    status: 'Off Duty',
  },
];

let mockEnrollments: StudentEnrollment[] = [
  {
    id: 'ENR-101',
    studentId: 'ST-501',
    studentName: 'Aarav Sharma (Class 8-A)',
    scheduleId: 'SCH-8942-X',
    routeName: 'Northern Express Corridor',
    boardingStop: 'Hebbal Flyover Circle',
    dropStop: 'School Main Gate',
    enrolledAt: '2026-07-10',
  },
  {
    id: 'ENR-102',
    studentId: 'ST-502',
    studentName: 'Ananya Gupta (Class 10-B)',
    scheduleId: 'SCH-4120-Y',
    routeName: 'Suburban Loop South',
    boardingStop: 'School Gate #2',
    dropStop: 'Jayanagar 4th Block',
    enrolledAt: '2026-07-12',
  },
];

// Simple Event Listener System for Instant UI Updates
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export const busStore = {
  getBuses: () => [...mockBuses],
  getRoutes: () => [...mockRoutes],
  getSchedules: () => [...mockSchedules],
  getDrivers: () => [...mockDrivers],
  getEnrollments: () => [...mockEnrollments],

  addBus: (bus: Omit<BusVehicle, 'id'>) => {
    const newBus: BusVehicle = {
      ...bus,
      id: `bus-${Date.now()}`,
    };
    mockBuses.unshift(newBus);
    busStore.notify();
    return newBus;
  },

  addRoute: (route: Omit<BusRoute, 'id'>) => {
    const newRoute: BusRoute = {
      ...route,
      id: `route-${Date.now()}`,
    };
    mockRoutes.unshift(newRoute);
    busStore.notify();
    return newRoute;
  },

  addSchedule: (sched: Omit<BusSchedule, 'id'>) => {
    const newSched: BusSchedule = {
      ...sched,
      id: `SCH-${Math.floor(1000 + Math.random() * 9000)}-Z`,
    };
    mockSchedules.unshift(newSched);
    busStore.notify();
    return newSched;
  },

  addDriver: (driver: Omit<BusDriver, 'id' | 'initials' | 'rating' | 'totalTrips'>) => {
    const nameParts = driver.fullName.trim().split(' ');
    const initials = nameParts.length >= 2 
      ? `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase()
      : driver.fullName.substring(0, 2).toUpperCase();

    const newDriver: BusDriver = {
      ...driver,
      id: `DRV-${Math.floor(400 + Math.random() * 500)}`,
      initials,
      rating: 5.0,
      totalTrips: 0,
    };
    mockDrivers.unshift(newDriver);
    busStore.notify();
    return newDriver;
  },

  enrollStudent: (enrollment: Omit<StudentEnrollment, 'id' | 'enrolledAt'>) => {
    const newEnrollment: StudentEnrollment = {
      ...enrollment,
      id: `ENR-${Date.now()}`,
      enrolledAt: new Date().toISOString().split('T')[0],
    };
    mockEnrollments.unshift(newEnrollment);
    busStore.notify();
    return newEnrollment;
  },

  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  notify: () => {
    listeners.forEach(fn => fn());
  },
};
