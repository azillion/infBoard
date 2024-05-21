import { setup } from 'xstate';

export interface AppContext { }

export type AppEvent = { type: 'CONNECTION_ESTABLISHED' };

const context: AppContext = {};

const appMachine = setup({
    types: {} as {
        context: AppContext;
        event: AppEvent;
    },
}).createMachine(
    {
        id: 'app',
        initial: 'loading',
        context,
        types: {} as {
            context: AppContext;
            event: AppEvent;
        },
        states: {
            loading: {
                on: {
                    CONNECTION_ESTABLISHED: {
                        target: 'drawing'
                    }
                }
            },
            drawing: {}
        }
    },
);

export default appMachine;

