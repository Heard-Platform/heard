import { Environment } from "../../types";

export const getEnvironment = (): Environment => {
  return (import.meta.env.VITE_HEARD_ENV as Environment) || "development";
};