import logdown from "logdown";
export declare const deploymentsFolder = "./deployments";
export interface DeployedContract {
    name: string;
    address: string;
    version: string;
    implementation?: string;
    date?: string;
}
export interface DeploymentOutput {
    registrar?: DeployedContract;
    basicController?: DeployedContract;
    authController?: DeployedContract;
    stakingController?: DeployedContract;
}
export declare const getLogger: (title: string) => logdown.Logger;
export declare const getDeploymentData: (network: string) => DeploymentOutput;
export declare const getWords: () => string[];
export declare const getWord: (index: number) => string;
