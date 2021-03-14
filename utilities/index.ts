import logdown from "logdown";

export const deploymentsFolder = "./deployments";

export interface DeployedContract {
  name: string;
  address: string;
  version: string;
  implementation?: string;
}

export interface DeploymentOutput {
  registrar?: DeployedContract;
}

const root = "zns";

export const getLogger = (title: string) => {
  const logger = logdown(`${root}::${title}`);
  logger.state.isEnabled = true;
  return logger;
};
