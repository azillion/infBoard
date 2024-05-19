import { createActorContext } from "@xstate/react";
import appMachine from "../state/appMachine";

export const AppContext = createActorContext(appMachine);
