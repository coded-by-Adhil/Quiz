export interface PingResponse {
  status: string;
}

export interface HealthResponse {
  status: "ok";
  database: "connected";
}
