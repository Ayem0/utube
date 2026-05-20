import { AnyFeature, Feature } from "./feature";

export const createFeature = <
  TName extends string,
  TState extends object,
  TPrivateState extends object,
  TApi extends object,
  TDependencies extends readonly AnyFeature[],
>(
  feature: Omit<
    Feature<TName, TState, TPrivateState, TApi, TDependencies>,
    "getInternalInitialState"
  > & {
    getInternalInitialState?: () => TPrivateState;
  },
): Feature<TName, TState, TPrivateState, TApi, TDependencies> => {
  return {
    ...feature,
    getInternalInitialState:
      feature.getInternalInitialState ?? (() => ({}) as TPrivateState),
  };
};
