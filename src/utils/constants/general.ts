import { Environment } from "../../types";

export const getEnvironment = (): Environment => {
  return (process.env.NODE_ENV as Environment) || "development";
};