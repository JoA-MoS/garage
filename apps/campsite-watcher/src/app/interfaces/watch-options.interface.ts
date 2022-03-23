export interface WatchOptions {
  campgroundName: string;
  campgroundId: number;
  dates: Date[];
  loops?: string[];
  site?: string;
  emails: string[];
  // add a way to ignore certain results
  // add a way to find consecutive days in a range
}
