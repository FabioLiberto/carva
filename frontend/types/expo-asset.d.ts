declare module "expo-asset" {
  export class Asset {
    static fromModule(moduleId: number): Asset;
    readonly uri: string;
    readonly localUri: string | null;
  }
}

