// The shapes of the JSON the exporter writes (and the API returns).

export type ContactStatus = "completed" | "failed" | "scheduled";
export type StationStatus = "online" | "offline";

export interface Meta {
  start: string;
  end: string;
  now: string;
  satellites: number;
  stations: number;
  passes: number;
  requests: number;
}

export interface Satellite {
  id: string;
  name: string;
}

export interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  antennas: number;
  status: StationStatus;
}

export interface Contact {
  request_id: string;
  satellite_id: string;
  station_id: string;
  antenna: number;
  start: string;
  end: string;
  priority: string;
  status: ContactStatus;
}

export interface RequestRow {
  id: string;
  satellite_id: string;
  priority: string;
  duration_min: number;
  deadline: string | null;
  scheduled: boolean;
  status: string;
  station_id: string | null;
  start: string | null;
  reason: string | null;
}

export interface StationMetric {
  station_id: string;
  name: string;
  antennas: number;
  booked_minutes: number;
  utilization: number;
}

export interface Metrics {
  total_requests: number;
  scheduled: number;
  unscheduled: number;
  schedule_rate: number;
  by_status: Record<string, number>;
  by_station: StationMetric[];
}
